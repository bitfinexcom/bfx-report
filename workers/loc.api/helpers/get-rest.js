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

class RateLimitChecker {
  constructor (conf) {
    this.rateLimit = conf?.rateLimit ?? 10
    this.msPeriod = conf?.msPeriod ?? 60000

    this._calls = []
  }

  clearOldCalls (mts = Date.now()) {
    const min = mts - this.msPeriod

    while (this._calls[0] && this._calls[0] < min) {
      this._calls.shift()
    }
  }

  add () {
    const mts = Date.now()

    this.clearOldCalls(mts)
    this._calls.push(mts)
  }

  getLength () {
    this.clearOldCalls()

    return this._calls.length
  }

  check () {
    return this.getLength() >= this.rateLimit
  }
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
    expirableSetMaps.set(
      apiAuthKeys,
      { map: new Map(), tokenTimer: null }
    )
  }

  const expirableSetMapByApiKeys = expirableSetMaps.get(apiAuthKeys)

  /*
   * It's important to prevent memory leaks as
   * we can have a lot of refreshable auth tokens for one user
   */
  if (authToken) {
    clearTimeout(expirableSetMapByApiKeys.tokenTimer)

    expirableSetMapByApiKeys.tokenTimer = setTimeout(() => {
      expirableSetMaps?.delete(apiAuthKeys)
    }, 10 * 60 * 1000).unref()
  }

  const rateLimit = _getRateLimitByMethodName(methodName)

  if (!expirableSetMapByApiKeys.map.has(methodName)) {
    expirableSetMapByApiKeys.map.set(
      methodName,
      new RateLimitChecker({ rateLimit })
    )
  }

  const rateLimitChecker = expirableSetMapByApiKeys.map.get(methodName)

  if (rateLimitChecker.check()) {
    // Cool down delay
    return new Promise((resolve) => setTimeout(resolve, 60000))
      .then(() => {
        rateLimitChecker.add()

        return method()
      })
  }

  rateLimitChecker.add()

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
      timeout = 90000
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
