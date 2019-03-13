'use strict'

const BFX = require('bitfinex-api-node')

const { GrenacheServiceConfigArgsError } = require('../errors')

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

const createBFX = ({ apiKey = '', apiSecret = '', authToken = '', ip = '', conf = {} }) => {
  _checkConf(conf)
  const auth = (authToken)
    ? { authToken, ip }
    : { apiKey, apiSecret }
  return new BFX({
    ...auth,
    company: conf.company,
    rest: {
      url: isTestEnv ? 'http://localhost:9999' : conf.restUrl
    }
  })
}

module.exports = createBFX
