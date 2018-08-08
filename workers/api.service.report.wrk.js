'use strict'

const { WrkApi } = require('bfx-wrk-api')
const async = require('async')
const _ = require('lodash')

const processor = require('./loc.api/queue/processor')
const aggregator = require('./loc.api/queue/aggregator')

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

    if (type === 'api_bfx') {
      ctx.lokue_processor = this.lokue_processor
      ctx.lokue_aggregator = this.lokue_aggregator
    }

    return ctx
  }

  init () {
    super.init()

    const persist = true

    const facs = [
      [
        'fac',
        'bfx-facs-lokue',
        'processor',
        'processor',
        { persist, name: 'queue' }
      ],
      [
        'fac',
        'bfx-facs-lokue',
        'aggregator',
        'aggregator',
        { persist, name: 'queue' }
      ]
    ]
    this.setInitFacs(facs)
  }

  _start (cb) {
    async.series([
      next => {
        super._start(next)
      },
      next => {
        const processorQueue = this.lokue_processor.q
        const aggregatorQueue = this.lokue_aggregator.q
        const group = this.group
        const conf = this.conf[group]
        const reportService = this.grc_bfx.api

        if (!reportService.ctx) {
          reportService.ctx = reportService.caller.getCtx()
        }

        processor.setReportService(reportService)
        aggregator.setReportService(reportService)

        processorQueue.on('job', processor)
        aggregatorQueue.on('job', aggregator)

        processorQueue.on('completed', (result) => {
          aggregatorQueue.addJob({
            ...result,
            emailConf: conf.emailConf,
            s3Conf: conf.s3Conf
          })
        })
        processorQueue.on('error:auth', (job) => {
          const data = _.cloneDeep(job.data)
          delete data.columnsCsv

          processorQueue.addJob({
            ...data,
            isUnauth: true
          })
        })

        next()
      }
    ], cb)
  }
}

module.exports = WrkReportServiceApi
