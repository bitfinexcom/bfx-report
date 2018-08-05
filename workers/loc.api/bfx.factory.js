'use strict'

const BFX = require('bitfinex-api-node')

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

const createBFX = ({ apiKey = '', apiSecret = '', authToken = '', conf = {} }) => {
  _checkConf(conf)
  const auth = (authToken)
    ? { authToken }
    : { apiKey, apiSecret }
  return new BFX({
    ...auth,
    rest: {
      url: conf.restUrl
    }
  })
}

module.exports = createBFX
