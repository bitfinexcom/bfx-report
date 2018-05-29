'use strict'

const BFX = require('bitfinex-api-node')

const REST_URL = 'https://dev-prdn.bitfinex.com:2998'// TODO:
const WS_URL = 'wss://dev-prdn.bitfinex.com:2998'// TODO:

const createBFX = ({ apiKey = '', apiSecret = '' }) => {
  return new BFX({
    apiKey,
    apiSecret,
    ws: {
      url: WS_URL
    },
    rest: {
      url: REST_URL
    }
  })
}

module.exports = createBFX
