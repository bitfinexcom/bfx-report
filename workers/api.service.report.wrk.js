'use strict'

const { WrkApi } = require('bfx-wrk-api')

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
    super.init()

    const ctx = super.getPluginCtx(type)

    switch (type) {
      case 'api_bfx':
        ctx.bull_processor = this.bull_processor
        ctx.bull_aggregator = this.bull_aggregator
        break
    }

    return ctx
  }

  init () {
    super.init()

    this.setInitFacs([
      [
        'fac',
        'bfx-facs-bull',
        'processor',
        'processor',
        () => this.getBullProcConf()
      ],
      [
        'fac',
        'bfx-facs-bull',
        'aggregator',
        'aggregator',
        () => this.getBullAggrConf()
      ]
    ])
  }

  getBullProcConf () {
    const group = this.group
    const conf = this.conf[group]

    if (
      conf &&
      typeof conf.bull === 'object' &&
      conf.bull.processor &&
      conf.bull.processor.queue
    ) {
      return {
        port: conf.bull.port,
        host: conf.bull.host,
        auth: conf.bull.auth,
        queue: conf.bull.processor.queue
      }
    }

    return null
  }

  getBullAggrConf () {
    const group = this.group
    const conf = this.conf[group]

    if (
      conf &&
      typeof conf.bull === 'object' &&
      conf.bull.aggregator &&
      conf.bull.aggregator.queue
    ) {
      return {
        port: conf.bull.port,
        host: conf.bull.host,
        auth: conf.bull.auth,
        queue: conf.bull.aggregator.queue
      }
    }

    return null
  }
}

module.exports = WrkReportServiceApi
