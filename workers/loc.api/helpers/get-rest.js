'use strict'

const BFX = require('bitfinex-api-node')

const {
  isNonceSmallError
} = require('./api-errors-testers')
const {
  AuthError,
  GrenacheServiceConfigArgsError
} = require('../errors')
const BfxApiRouter = require('../bfx.api.router')

const isTestEnv = process.env.NODE_ENV === 'test'
let bfxInstance = null

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

const _route = (bfxApiRouter, methodName, args, interrupter) => {
  if (!(bfxApiRouter instanceof BfxApiRouter)) {
    return Reflect.apply(...args)
  }

  return bfxApiRouter.route(
    methodName,
    () => Reflect.apply(...args),
    interrupter
  )
}

const _asyncApplyHook = async (
  bfxApiRouter,
  incomingRes,
  propKey,
  args,
  interrupter
) => {
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

      const res = await _route(
        bfxApiRouter,
        propKey,
        args,
        interrupter
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

const _getRestProxy = (rest, deps) => {
  const {
    bfxApiRouter,
    interrupter
  } = deps
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
              const res = _route(
                bfxApiRouter,
                propKey,
                args,
                interrupter
              )

              if (_isNotPromiseOrBluebird(res)) {
                return res
              }

              return _asyncApplyHook(
                bfxApiRouter,
                res,
                propKey,
                args,
                interrupter
              )
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

module.exports = (conf, bfxApiRouter) => {
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
      timeout = 90000,
      interrupter
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
    const proxy = _getRestProxy(rest, {
      bfxApiRouter,
      interrupter
    })

    return proxy
  }
}
