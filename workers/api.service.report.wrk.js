'use strict'

const { WrkApi } = require('bfx-wrk-api')
const async = require('async')
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

const container = require('./loc.api/di')
const diConfig = require('./loc.api/di/di.config')
const appDeps = require('./loc.api/di/app.deps')
const coreDeps = require('./loc.api/di/core.deps')
const TYPES = require('./loc.api/di/types')

class WrkReportServiceApi extends WrkApi {
  constructor (conf, ctx, args = []) {
    super(conf, ctx)

    this.loadConf('service.report', 'report')

    this.setArgsOfCommandLineToConf()

    this.coreDeps = []
    this.appDeps = []

    this.loadDIConfig()
    this.loadCoreDeps()

    this.logger = this.container.get(TYPES.Logger)

    this.init()
    this.start()
  }

  loadDIConfig (cont = container) {
    const conf = this.conf[this.group]

    this.container = cont

    diConfig(conf)
  }

  loadCoreDeps (...args) {
    this.coreDeps.push(coreDeps(...args))
    this.container.load(...this.coreDeps)
  }

  loadAppDeps (...args) {
    this.appDeps.push(appDeps(...args))
    this.container.load(...this.appDeps)
  }

  getPluginCtx (type) {
    const ctx = super.getPluginCtx(type)

    if (type === 'api_bfx') {
      ctx.lokue_processor = this.lokue_processor
      ctx.lokue_aggregator = this.lokue_aggregator
    }

    return ctx
  }

  setArgsOfCommandLineToConf (
    args = argv,
    names = [
      'isSpamRestrictionMode',
      'isLoggerDisabled'
    ]
  ) {
    const conf = this.conf[this.group]

    names.forEach(name => {
      if (typeof args[name] !== 'undefined') {
        conf[name] = args[name]
        this.ctx[name] = args[name]

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

  async initService (deps) {
    const processorQueue = this.lokue_processor.q
    const aggregatorQueue = this.lokue_aggregator.q
    const rService = this.grc_bfx.api

    if (!rService.ctx) {
      rService.ctx = rService.caller.getCtx()
    }

    this.loadAppDeps({
      rService,
      processorQueue,
      aggregatorQueue,
      deflateFac: this.deflate_gzip,
      link: this.grc_bfx.link,
      ...deps
    })
    await rService._initialize()

    const processor = this.container.get(TYPES.Processor)
    const aggregator = this.container.get(TYPES.Aggregator)

    processorQueue.on('job', processor)
    aggregatorQueue.on('job', aggregator)

    processorQueue.on('error:base', (err) => {
      this.logger.error(`PROCESSOR:QUEUE: ${err.stack || err}`)
    })
    aggregatorQueue.on('error:base', (err) => {
      this.logger.error(`AGGREGATOR:QUEUE: ${err.stack || err}`)
    })
  }

  async stopService () {}

  _start (cb) {
    async.series(
      [
        next => { super._start(next) },
        next => { this.initService().then(next).catch(next) },
        next => {
          this.emit('wrk:ready')

          next()
        }
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
        next => { this.stopService().then(next).catch(next) },
        next => { super._stop(next) },
        next => {
          this.container.unbindAll()
          this.container.unload(...this.coreDeps)
          this.container.unload(...this.appDeps)

          next()
        }
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
