'use strict'

const BFX = require('bitfinex-api-node')

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

module.exports = (conf, auth) => {
  if (typeof auth !== 'object') {
    throw new AuthError()
  }

  const bfx = _bfxFactory({ conf, ...auth })

  return bfx.rest(2, { transform: true })
}
