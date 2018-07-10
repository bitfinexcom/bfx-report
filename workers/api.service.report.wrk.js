'use strict'

const { WrkApi } = require('bfx-wrk-api')
const async = require('async')
const bullProcessor = require('./loc.api/bull/bull.processor')
const bullAggregator = require('./loc.api/bull/bull.aggregator')

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

  _checkBullAggregatorConf () {
    if (
      this.bull_aggregator &&
      typeof this.bull_aggregator.conf === 'object' &&
      typeof this.bull_aggregator.conf.emailOpts === 'object'
    ) {
      return
    }

    const err = new Error('ERR_CONFIG_ARGS_NO_EMAIL_TRANSPORT_OR_OPTS')

    throw err
  }

  getPluginCtx (type) {
    const ctx = super.getPluginCtx(type)

    if (this.conf.isElectronEnv) {
      return ctx
    }

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

    if (this.conf.isElectronEnv) {
      return
    }

    this.setInitFacs([
      [
        'fac',
        'bfx-facs-bull',
        'processor',
        'processor',
        () => this.getBullConf('processor')
      ],
      [
        'fac',
        'bfx-facs-bull',
        'aggregator',
        'aggregator',
        () => this.getBullConf('aggregator')
      ]
    ])
  }

  getBullConf (name) {
    const group = this.group
    const conf = this.conf[group]

    if (
      conf &&
      typeof conf.bull === 'object'
    ) {
      return {
        port: conf.bull.port,
        host: conf.bull.host,
        auth: conf.bull.auth,
        queue: name
      }
    }

    return null
  }

  _start (cb) {
    this._checkBullAggregatorConf()

    async.series([ next => { super._start(next) },
      next => {
        if (this.conf.isElectronEnv) {
          next()

          return
        }

        const reportService = this.grc_bfx.api
        const processorQueue = this.bull_processor.queue
        const aggregatorQueue = this.bull_aggregator.queue

        bullProcessor.setReportService(reportService)
        bullAggregator.setReportService(reportService)

        processorQueue.process('*', 1, bullProcessor)
        aggregatorQueue.process('*', 1, bullAggregator)

        processorQueue.on('completed', (job, result) => {
          aggregatorQueue.add(
            job.name,
            result,
            {
              attempts: 10,
              backoff: {
                type: 'fixed',
                delay: 60000
              },
              timeout: 1800000
            }
          )
        })

        next()
      }
    ], cb)
  }
}

module.exports = WrkReportServiceApi
