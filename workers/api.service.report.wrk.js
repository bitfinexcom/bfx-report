'use strict'

const { WrkApi } = require('bfx-wrk-api')
const async = require('async')
const uuidv4 = require('uuid/v4')

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

  getPluginCtx (type) {
    const ctx = super.getPluginCtx(type)
    const appType = this.conf.app_type

    if (type === 'api_bfx' && appType === 'nodejs') {
      ctx.bull_processor = this.bull_processor
      ctx.bull_aggregator = this.bull_aggregator
    }

    return ctx
  }

  init () {
    super.init()

    const appType = this.conf.app_type

    if (appType === 'nodejs') {
      const facs = [
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
      ]
      this.setInitFacs(facs)
    }
  }

  getBullConf (name) {
    const group = this.group
    const conf = this.conf[group]

    if (
      conf &&
      typeof conf.redisConnection === 'object'
    ) {
      return {
        port: conf.redisConnection.port,
        host: conf.redisConnection.host,
        queue: `${name}-${uuidv4()}`
      }
    }

    return null
  }

  _start (cb) {
    const appType = this.conf.app_type

    async.series([
      next => {
        super._start(next)
      },
      next => {
        if (appType === 'nodejs') {
          const processorQueue = this.bull_processor.queue
          const aggregatorQueue = this.bull_aggregator.queue

          processorQueue.process('*', bullProcessor)
          aggregatorQueue.process('*', bullAggregator)

          processorQueue.on('completed', (job, result) => {
            aggregatorQueue.add(job.name, result)
          })
        }

        next()
      }
    ], cb)
  }
}

module.exports = WrkReportServiceApi
