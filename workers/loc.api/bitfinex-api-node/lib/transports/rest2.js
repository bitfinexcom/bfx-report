'use strict'

const { RESTv2: RESTv2Base } = require('bitfinex-api-node')
const Ledgers = require('../models/ledgers')
const Movements = require('../models/movements')

class RESTv2 extends RESTv2Base {
  /**
   * @param {string|null} symbol
   * @param {Method} cb
   * @return {Promise}
   * @see https://docs.bitfinex.com/v2/reference#ledgers
   */
  ledgers (symbol, cb) {
    if (symbol) return this._makeAuthRequest(`/auth/r/ledgers/${symbol}/hist`, {}, cb, Ledgers)

    return this._makeAuthRequest(`/auth/r/ledgers/hist`, {}, cb, Ledgers)
  }

  /**
   * @param {string} symbol
   * @param {Method} cb
   * @return {Promise}
   * @see https://docs.bitfinex.com/v2/reference#movements
   */
  movements (symbol = 'BTC', cb) {
    return this._makeAuthRequest(`/auth/r/movements/${symbol}/hist`, {}, cb, Movements)
  }
}

module.exports = RESTv2
