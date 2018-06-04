'use strict'

const BFXBase = require('bitfinex-api-node')
const { RESTv1 } = require('bitfinex-api-node')
const RESTv2 = require('./lib/transports/rest2')

class BFX extends BFXBase {
  /**
   * @param {number} versio
   * @param {Object} extraOpts
   * @return {RESTv1|RESTv2}
   */
  rest (version = 2, extraOpts = {}) {
    if (version !== 1 && version !== 2) {
      throw new Error(`invalid http API version: ${version}`)
    }

    const key = `${version}|${JSON.stringify(extraOpts)}`

    if (!this._transportCache.rest[key]) {
      Object.assign(extraOpts, this._restArgs)
      const payload = this._getTransportPayload(extraOpts)

      this._transportCache.rest[key] =
        version === 2 ? new RESTv2(payload) : new RESTv1(payload)
    }

    return this._transportCache.rest[key]
  }
}

module.exports = BFX
