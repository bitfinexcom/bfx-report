'use strict'

const { WrkApi } = require('bfx-wrk-api')
const async = require('async')
const _ = require('lodash')
const path = require('path')
const argv = require('yargs')
  .option('dbId', {
    type: 'number',
    default: 1
  })
  .option('csvFolder', {
    type: 'string'
  })
  .option('syncMode', {
    type: 'boolean'
  })
  .option('isSpamRestrictionMode', {
    type: 'boolean'
  })
  .option('isEnableScheduler', {
    type: 'boolean'
  })
  .option('dbDriver', {
    choices: ['sqlite'],
    type: 'string'
  })
  .help('help')
  .argv

const processor = require('./loc.api/queue/processor')
const aggregator = require('./loc.api/queue/aggregator')
const sync = require('./loc.api/sync')

class WrkReportServiceApi extends WrkApi {
  constructor (conf, ctx) {
    super(conf, ctx)

    this.loadConf('service.report', 'report')
    this._setArgsOfCommandLineToConf([
      'syncMode',
      'isSpamRestrictionMode',
      'isEnableScheduler',
      'dbDriver'
    ])

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

  _setArgsOfCommandLineToConf (names = []) {
    const group = this.group
    const conf = this.conf[group]

    names.forEach(name => {
      if (typeof argv[name] !== 'undefined') {
        conf[name] = argv[name]
        this.ctx[name] = argv[name]
      } else if (typeof this.ctx[name] !== 'undefined') {
        conf[name] = this.ctx[name]
      }
    })
  }

  init () {
    super.init()

    const persist = true
    const dbId = this.ctx.dbId || argv.dbId || 1
    const name = `queue_${dbId}`
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
          if (reportService._databaseInitialize) {
            await reportService._databaseInitialize()
          }

          if (conf.isEnableScheduler) {
            const { rule } = require(path.join(this.ctx.root, 'config', 'schedule.json'))
            const name = 'sync'

            sync.setReportService(reportService)

            this.scheduler_sync.add(name, sync, rule)

            const job = this.scheduler_sync.mem.get(name)
            job.rule = rule
          }
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
