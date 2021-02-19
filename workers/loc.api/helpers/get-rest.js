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

const _asyncApplyHook = async (incomingRes, ...args) => {
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

      const res = await Reflect.apply(...args)

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

const _getRestProxy = (rest) => {
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
          let attemptsCount = 0
          let caughtErr = null

          while (attemptsCount < 10) {
            try {
              const res = Reflect.apply(...arguments)

              if (_isNotPromiseOrBluebird(res)) {
                return res
              }

              return _asyncApplyHook(res, ...arguments)
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

  return (auth) => {
    if (
      !auth ||
      typeof auth !== 'object'
    ) {
      throw new AuthError()
    }

    const {
      apiKey = '',
      apiSecret = '',
      authToken = '',
      ip = ''
    } = auth
    const _auth = authToken
      ? { authToken, ip }
      : { apiKey, apiSecret }

    const rest = bfxInstance.rest(2, _auth)
    const proxy = _getRestProxy(rest)

    return proxy
  }
}
