'use strict'

const BFX = require('bitfinex-api-node')

const isTestEnv = process.env.NODE_ENV === 'test'

const _checkConf = (conf) => {
  if (
    conf &&
    typeof conf.restUrl === 'string'
  ) {
    return
  }

  const err = new Error('ERR_CONFIG_ARGS_NO_GRENACHE_SERVICE')

  throw err
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
