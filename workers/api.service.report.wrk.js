'use strict'

const { WrkApi } = require('bfx-wrk-api')
const async = require('async')
const _ = require('lodash')
const argv = require('yargs').argv
const path = require('path')

const processor = require('./loc.api/queue/processor')
const aggregator = require('./loc.api/queue/aggregator')
const sync = require('./loc.api/sync')

class WrkReportServiceApi extends WrkApi {
  constructor (conf, ctx) {
    super(conf, ctx)

    this.loadConf('service.report', 'report')

    this.init()
    this.start()
  }

  getApiConf () {
    const group = this.group
    const conf = this.conf[group]
    const suffix = conf.syncMode ? `.${conf.dbDriver}` : ''

    return {
      path: `service.report${suffix}`
    }
  }

  getPluginCtx (type) {
    const ctx = super.getPluginCtx(type)
    const group = this.group
    const conf = this.conf[group]

    if (type === 'api_bfx') {
      ctx.lokue_processor = this.lokue_processor
      ctx.lokue_aggregator = this.lokue_aggregator

      if (conf.syncMode) {
        const dbFacNs = this.getFacNs(`db-${conf.dbDriver}`, 'm0')

        ctx.scheduler_sync = this.scheduler_sync
        ctx[dbFacNs] = this[dbFacNs]
      }
    }

    return ctx
  }

  init () {
    super.init()

    const persist = true
    const dbID = this.ctx.dbID || argv.dbID || 1
    const name = `queue_${dbID}`
    const group = this.group
    const conf = this.conf[group]

    const facs = [
      [
        'fac',
        'bfx-facs-lokue',
        'processor',
        'processor',
        { persist, name }
      ],
      [
        'fac',
        'bfx-facs-lokue',
        'aggregator',
        'aggregator',
        { persist, name }
      ]
    ]

    if (conf.syncMode) {
      facs.push(
        [
          'fac',
          'bfx-facs-scheduler',
          'sync',
          'sync',
          { label: 'sync' }
        ],
        [
          'fac',
          `bfx-facs-db-${conf.dbDriver}`,
          'm0',
          'm0',
          { name: 'sync' }
        ]
      )
    }

    this.setInitFacs(facs)
  }

  _start (cb) {
    async.series([
      next => {
        super._start(next)
      },
      async next => {
        const processorQueue = this.lokue_processor.q
        const aggregatorQueue = this.lokue_aggregator.q
        const group = this.group
        const conf = this.conf[group]
        const reportService = this.grc_bfx.api

        if (!reportService.ctx) {
          reportService.ctx = reportService.caller.getCtx()
        }

        if (conf.syncMode) {
          if (reportService._createIndex) await reportService._createIndex()
          if (
            !conf.auth ||
            !conf.auth.apiKey ||
            typeof conf.auth.apiKey !== 'string' ||
            !conf.auth.apiSecret ||
            typeof conf.auth.apiSecret !== 'string'
          ) throw new Error('ERR_SYNC_MODE_NOT_AUTH')

          const { rule } = require(path.join(this.ctx.root, 'config', 'schedule.json'))
          const name = 'sync'

          sync.setReportService(reportService)

          this.scheduler_sync.add(name, sync, rule)

          const job = this.scheduler_sync.mem.get(name)
          job.rule = rule

          sync()
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
