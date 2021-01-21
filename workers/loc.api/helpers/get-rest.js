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
    typeof conf.restUrl === 'string' &&
    typeof conf.company === 'string'
  ) {
    return
  }

  throw new GrenacheServiceConfigArgsError()
}

const _bfxFactory = (conf) => {
  _checkConf(conf)

  const { restUrl, company } = conf

  return new BFX({
    transform: true,
    company,
    rest: {
      url: isTestEnv
        ? 'http://localhost:9999'
        : restUrl
    }
  })
}

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
        async apply () {
          let attemptsCount = 0
          let caughtErr = null

          while (attemptsCount < 10) {
            try {
              const res = await Reflect.apply(...arguments)

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
