'use strict'

const { Api } = require('@bitfinex/bfx-wrk-api')

function createApi (addFunctions) {
  class ExtApi extends Api {
    space (service, msg) {
      const space = super.space(service, msg)
      return space
    }
  }

  addFunctions(ExtApi)

  return ExtApi
}

module.exports = createApi
