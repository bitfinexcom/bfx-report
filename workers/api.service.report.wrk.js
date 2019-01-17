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
  .option('reportsFramework', {
    type: 'boolean'
  })
  .option('isSpamRestrictionMode', {
    type: 'boolean'
  })
  .option('isSchedulerEnabled', {
    type: 'boolean'
  })
  .option('dbDriver', {
    choices: ['sqlite'],
    type: 'string'
  })
  .help('help')
  .argv

const logger = require('./loc.api/logger')
const processor = require('./loc.api/queue/processor')
const aggregator = require('./loc.api/queue/aggregator')
const sync = require('./loc.api/sync')
const { ReportsFrameworkConfPropError } = require('./loc.api/errors')
const {
  addMethodCollMap,
  addModelsMap
} = require('./loc.api/sync/schema')
const { addAllowedColls } = require('./loc.api/sync/allowed.colls')

class WrkReportServiceApi extends WrkApi {
  constructor (conf, ctx) {
    super(conf, ctx)

    this.logger = logger

    this.loadConf('service.report', 'report')
    this._setArgsOfCommandLineToConf([
      'syncMode',
      'reportsFramework',
      'isSpamRestrictionMode',
      'isSchedulerEnabled',
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

        if (conf.reportsFramework) {
          ctx.reportsFramework = this.reportsFramework_sync
        }
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

    if (conf.reportsFramework && !conf.syncMode) {
      throw new ReportsFrameworkConfPropError()
    }
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
      ],
      [
        'fac',
        'bfx-facs-deflate',
        'gzip',
        'gzip',
        { level: 9 }
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

      if (conf.reportsFramework) {
        facs.push(
          [
            'fac',
            `bfx-facs-reports-framework`,
            'sync',
            'sync',
            {
              name: 'sync',
              start: (rFram, next) => {
                this._initReportsFramework(rFram)

                next()
              }
            }
          ]
        )
      }
    }

    this.setInitFacs(facs)
  }

  _initReportsFramework (rFram) {
    rFram.injectDeps({
      ..._.pick(
        require('./loc.api/helpers'),
        [
          'getREST',
          'prepareResponse',
          'checkParams',
          'getDateNotMoreNow',
          'getMethodLimit',
          'logError'
        ]
      )
    })

    addAllowedColls(rFram.getAllowedColls())
    addMethodCollMap(rFram.getMethodCollMap())
    addModelsMap(rFram.getModelsMap())
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
          try {
            await reportService._syncModeInitialize()
          } catch (err) {
            this.logger.error(err.stack || err)
          }

          sync.setReportService(reportService)

          if (conf.isSchedulerEnabled) {
            const { rule } = require(path.join(this.ctx.root, 'config', 'schedule.json'))
            const name = 'sync'

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
