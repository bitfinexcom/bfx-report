'use strict'

const BFX = require('bitfinex-api-node')
const config = require('config')

const _checkConf = () => {
  if (
    config.has('grenacheService') &&
    config.has('grenacheService.restUrl') &&
    config.has('grenacheService.wsUrl')
  ) {
    return
  }

  const err = new Error('ERR_CONFIG_ARGS_NO_GRENACHE_SERVICE')

  throw err
}

_checkConf()

const createBFX = ({ apiKey = '', apiSecret = '' }) => {
  return new BFX({
    apiKey,
    apiSecret,
    ws: {
      url: config.get('grenacheService.wsUrl')
    },
    rest: {
      url: config.get('grenacheService.restUrl')
    }
  })
}

module.exports = createBFX
