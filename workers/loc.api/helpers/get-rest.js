'use strict'

const BFX = require('bitfinex-api-node')

const {
  isNonceSmallError
} = require('./api-errors-testers')
const {
  AuthError,
  GrenacheServiceConfigArgsError
} = require('../errors')

const isTestEnv = process.env.NODE_ENV === 'test'
let bfxInstance = null

const expirableSetMaps = new Map()
// TODO:
const _rateLimitForMethodName = new Map([
  ['trades', 45]
])

const _getRateLimitByMethodName = (methodName) => {
  return _rateLimitForMethodName.get(methodName) ?? 45 // TODO:
}

const _addExpirableItemToSet = (set) => {
  const item = setTimeout(() => {
    set.delete(item)
  }, 60000).unref()

  set.add(item)
}

const router = (methodName, auth, method) => {
  const { authToken, apiKey, apiSecret } = auth ?? {}

  if (
    !methodName ||
    methodName.startsWith('_') ||
    (
      !authToken &&
      (
        !apiKey ||
        !apiSecret
      )
    )
  ) {
    return method()
  }

  const apiAuthKeys = authToken ?? `${apiKey}-${apiSecret}`

  if (!expirableSetMaps.has(apiAuthKeys)) {
    expirableSetMaps.set(apiAuthKeys, new Map())

    /*
     * It's important to prevent memory leaks as
     * we can have a lot of refreshable auth tokens for one user
     */
    if (authToken) {
      setTimeout(() => {
        expirableSetMaps.delete(apiAuthKeys)
      }, 60 * 60 * 1000).unref() // TODO:
    }
  }

  const expirableSetMapByApiKeys = expirableSetMaps.get(apiAuthKeys)

  if (!expirableSetMapByApiKeys.has(methodName)) {
    expirableSetMapByApiKeys.set(methodName, new Set())
  }

  const expirableSet = expirableSetMapByApiKeys.get(methodName)
  const amount = expirableSet.size
  const rateLimit = _getRateLimitByMethodName(methodName)

  if (amount >= rateLimit) {
    return new Promise((resolve) => setTimeout(resolve, 60000))
      .then(() => {
        _addExpirableItemToSet(expirableSet)

        return method()
      })
  }

  _addExpirableItemToSet(expirableSet)

  return method()
}

const _checkConf = (conf) => {
  if (
    conf &&
    typeof conf === 'object' &&
    typeof conf.restUrl === 'string'
  ) {
    return
  }

  throw new GrenacheServiceConfigArgsError()
}

const _bfxFactory = (conf) => {
  _checkConf(conf)

  const { restUrl } = conf

  return new BFX({
    transform: true,
    rest: {
      url: isTestEnv
        ? 'http://localhost:9999'
        : restUrl
    }
  })
}

const _asyncApplyHook = async (incomingRes, propKey, auth, ...args) => {
  let attemptsCount = 0
  let caughtErr = null

  while (attemptsCount < 10) {
    try {
      if (
        attemptsCount === 0 &&
        incomingRes
      ) {
        const res = await incomingRes

        return res
      }

      const res = await router(
        propKey,
        auth,
        () => Reflect.apply(...args)
      )

      return res
    } catch (err) {
      if (isNonceSmallError(err)) {
        attemptsCount += 1
        caughtErr = err

        continue
      }

      throw err
    }
  }

  if (caughtErr) throw caughtErr
}

const _isNotPromiseOrBluebird = (instance) => (
  !(instance instanceof Promise) &&
  (
    !instance ||
    typeof instance !== 'object' ||
    typeof instance.constructor !== 'function' ||
    instance.constructor.name !== 'Promise'
  )
)

const _getRestProxy = (rest, auth) => {
  return new Proxy(rest, {
    get (target, propKey) {
      if (typeof target[propKey] !== 'function') {
        const val = Reflect.get(...arguments)

        return typeof val === 'function'
          ? val.bind(target)
          : val
      }

      return new Proxy(target[propKey], {
        apply () {
          const args = arguments
          let attemptsCount = 0
          let caughtErr = null

          while (attemptsCount < 10) {
            try {
              const res = router(
                propKey,
                auth,
                () => Reflect.apply(...args)
              )

              if (_isNotPromiseOrBluebird(res)) {
                return res
              }

              return _asyncApplyHook(res, propKey, auth, ...args)
            } catch (err) {
              if (isNonceSmallError(err)) {
                attemptsCount += 1
                caughtErr = err

                continue
              }

              throw err
            }
          }

          if (caughtErr) throw caughtErr
        }
      })
    }
  })
}

module.exports = (conf) => {
  bfxInstance = _bfxFactory(conf)

  return (auth, opts) => {
    if (
      !auth ||
      typeof auth !== 'object'
    ) {
      throw new AuthError()
    }

    const {
      apiKey = '',
      apiSecret = '',
      authToken: _authToken = ''
    } = auth
    const {
      timeout = 20000
    } = opts ?? {}

    /*
     * It uses dynamic getter to fetch refreshed auth token
     * from session in framework mode
     */
    const authToken = typeof auth?.authTokenFn === 'function'
      ? auth.authTokenFn()
      : _authToken

    const _auth = authToken
      ? { authToken }
      : { apiKey, apiSecret }
    const restOpts = {
      timeout,
      ..._auth
    }

    const rest = bfxInstance.rest(2, restOpts)
    const proxy = _getRestProxy(rest, _auth)

    return proxy
  }
}
