'use strict'

const { WrkApi } = require('bfx-wrk-api')

class WrkExtSendgridApi extends WrkApi {
  constructor (conf, ctx) {
    super(conf, ctx)

    this.loadConf('sendgrid.ext', 'ext')

    this.init()
    this.start()
  }

  init () {
    super.init()
  }

  getApiConf () {
    return {
      path: 'sendgrid.ext'
    }
  }

  getPluginCtx (type) {
    const ctx = super.getPluginCtx(type)
    return ctx
  }
}

module.exports = WrkExtSendgridApi
