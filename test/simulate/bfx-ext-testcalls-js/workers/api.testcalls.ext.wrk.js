'use strict'

const { WrkApi } = require('bfx-wrk-api')

class WrkExtTestcallsApi extends WrkApi {
  constructor (conf, ctx) {
    super(conf, ctx)

    this.loadConf('testcalls.ext', 'ext')

    this.init()
    this.start()
  }

  init () {
    super.init()
    this.callsDone = []
  }

  getApiConf () {
    return {
      path: 'testcalls.ext'
    }
  }

  getPluginCtx (type) {
    const ctx = super.getPluginCtx(type)

    switch (type) {
      case 'api_bfx':
        ctx.callsDone = this.callsDone
        break
    }

    return ctx
  }
}

module.exports = WrkExtTestcallsApi
