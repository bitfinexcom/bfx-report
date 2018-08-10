'use strict'

const { WrkApi } = require('bfx-wrk-api')

function createWorker (env, _init = null, _getPluginCtx = null) {
  class WrkCoreStub extends WrkApi {
    constructor (conf, ctx) {
      super(conf, ctx)

      this.init()
      this.start()
    }

    init () {
      super.init()

      if (_init) {
        _init(this)
      }
    }

    getGrcConf () {
      const grcConf = super.getGrcConf()
      grcConf.services = [env]

      return grcConf
    }

    getPluginCtx (type) {
      super.init()
      const ctx = super.getPluginCtx(type)

      if (_getPluginCtx) {
        _getPluginCtx(this, type, ctx)
      }

      return ctx
    }
  }

  return WrkCoreStub
}

module.exports = createWorker
