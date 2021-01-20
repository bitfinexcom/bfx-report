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

const _checkConf = (conf) => {
  if (
    conf &&
    typeof conf.restUrl === 'string'
  ) {
    return
  }

  throw new GrenacheServiceConfigArgsError()
}

const _bfxFactory = ({
  apiKey = '',
  apiSecret = '',
  authToken = '',
  ip = '',
  conf = {}
}) => {
  _checkConf(conf)

  const auth = (authToken)
    ? { authToken, ip }
    : { apiKey, apiSecret }

  return new BFX({
    ...auth,
    company: conf.company,
    rest: {
      url: isTestEnv
        ? 'http://localhost:9999'
        : conf.restUrl
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

module.exports = (
  conf
) => (
  auth
) => {
  if (typeof auth !== 'object') {
    throw new AuthError()
  }

  const bfx = _bfxFactory({ conf, ...auth })
  const rest = bfx.rest(2, { transform: true })

  return _getRestProxy(rest)
}
