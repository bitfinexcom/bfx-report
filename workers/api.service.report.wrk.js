'use strict'

const { WrkApi } = require('bfx-wrk-api')
const async = require('async')
const { cloneDeep } = require('lodash')
const argv = require('yargs')
  .option('dbId', {
    type: 'number',
    default: 1
  })
  .option('csvFolder', {
    type: 'string'
  })
  .option('isSpamRestrictionMode', {
    type: 'boolean'
  })
  .option('isLoggerDisabled', {
    type: 'boolean',
    default: false
  })
  .help('help')
  .argv

const logger = require('./loc.api/logger')
const processor = require('./loc.api/queue/processor')
const aggregator = require('./loc.api/queue/aggregator')

class WrkReportServiceApi extends WrkApi {
  constructor (conf, ctx) {
    super(conf, ctx)

    this.loadConf('service.report', 'report')

    this._setArgsOfCommandLineToConf([
      'isSpamRestrictionMode',
      'isLoggerDisabled'
    ])

    this.logger = logger(conf.report.isLoggerDisabled)

    this.init()
    this.start()
  }

  getPluginCtx (type) {
    const ctx = super.getPluginCtx(type)

    if (type === 'api_bfx') {
      ctx.lokue_processor = this.lokue_processor
      ctx.lokue_aggregator = this.lokue_aggregator
    }

    return ctx
  }

  _setArgsOfCommandLineToConf (names = []) {
    const group = this.group
    const conf = this.conf[group]

    names.forEach(name => {
      if (typeof argv[name] !== 'undefined') {
        conf[name] = argv[name]
        this.ctx[name] = argv[name]

        return
      }
      if (typeof this.ctx[name] !== 'undefined') {
        conf[name] = this.ctx[name]
      }
    })
  }

  init () {
    super.init()

    const dbId = this.ctx.dbId || argv.dbId || 1
    const opts = {
      persist: true,
      name: `queue_${dbId}`
    }

    const facs = [
      [
        'fac',
        'bfx-facs-lokue',
        'processor',
        'processor',
        { ...opts }
      ],
      [
        'fac',
        'bfx-facs-lokue',
        'aggregator',
        'aggregator',
        { ...opts }
      ],
      [
        'fac',
        'bfx-facs-deflate',
        'gzip',
        'gzip',
        { level: 9 }
      ]
    ]

    this.setInitFacs(facs)
  }

  async _initService () {
    const processorQueue = this.lokue_processor.q
    const aggregatorQueue = this.lokue_aggregator.q
    const group = this.group
    const conf = this.conf[group]
    const reportService = this.grc_bfx.api

    if (!reportService.ctx) {
      reportService.ctx = reportService.caller.getCtx()
    }

    await reportService._initialize()

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
      const data = cloneDeep(job.data)
      delete data.columnsCsv

      if (Array.isArray(data.jobsData)) {
        data.jobsData.forEach(item => {
          delete item.columnsCsv
        })
      }

      processorQueue.addJob({
        ...data,
        isUnauth: true
      })
    })
    processorQueue.on('error:base', (err) => {
      this.logger.error(`PROCESSOR:QUEUE: ${err.stack || err}`)
    })
    aggregatorQueue.on('error:base', (err) => {
      this.logger.error(`AGGREGATOR:QUEUE: ${err.stack || err}`)
    })
  }

  _start (cb) {
    async.series(
      [
        next => { super._start(next) },
        next => { this._initService().then(next).catch(next) }
      ],
      err => {
        if (err) {
          this.logger.error(err.stack || err)

          setTimeout(() => process.exit(1), 2000)
        }

        cb()
      }
    )
  }

  _stop (cb) {
    async.series(
      [
        next => { super._stop(next) }
      ],
      err => {
        if (err) {
          this.logger.error(err.stack || err)

          setTimeout(() => process.exit(1), 2000)
        }

        cb()
      }
    )
  }
}

module.exports = WrkReportServiceApi
