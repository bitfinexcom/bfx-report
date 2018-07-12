'use strict'

const { WrkApi } = require('bfx-wrk-api')
const async = require('async')

class WrkReportServiceApi extends WrkApi {
  constructor (conf, ctx) {
    super(conf, ctx)

    this.loadConf('service.report', 'report')

    this.init()
    this.start()
  }

  getApiConf () {
    return {
      path: 'service.report'
    }
  }

  getPluginCtx (type) {
    const ctx = super.getPluginCtx(type)

    return ctx
  }

  init () {
    super.init()
  }

  _start (cb) {
    async.series([ next => { super._start(next) },
      next => {
        next()
      }
    ], cb)
  }
}

module.exports = WrkReportServiceApi
