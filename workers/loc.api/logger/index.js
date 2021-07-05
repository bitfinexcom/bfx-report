'use strict'

require('colors')
const os = require('os')
const path = require('path')
const argv = require('yargs').argv
const {
  createLogger,
  format,
  transports
} = require('winston')
const TransportStream = require('winston-transport')
const { MESSAGE } = require('triple-beam')

const { getLoggerDeps } = require('./logger-deps')

const {
  combine,
  timestamp,
  label,
  printf,
  align
} = format

const isProdEnv = (
  argv.env === 'production' ||
  process.env.NODE_ENV === 'production'
)
const isTestEnv = (
  argv.env === 'test' ||
  process.env.NODE_ENV === 'test'
)

const rootPath = path.join(__dirname, '../../..')
const basePath = path.isAbsolute(argv.logsFolder)
  ? argv.logsFolder
  : path.join(rootPath, argv.logsFolder)
const ext = '.log'

const pathError = path.join(
  basePath,
  `errors-worker${ext}`
)
const pathExcLogger = path.join(
  basePath,
  `exceptions-worker${ext}`
)
const logLabel = 'WORKER'
const maxSize = 1024000

class TransportSlack extends TransportStream {
  constructor (options = {}) {
    super(options)

    this.grcSlackFac = options.grcSlackFac
    this.eol = options.eol || os.EOL
  }

  log (info, callback) {
    (async () => {
      try {
        const {
          grcSlackFac,
          hasGrcService
        } = getLoggerDeps()

        // Grab the raw string and append the expected EOL
        const output = `${info[MESSAGE]}${this.eol}`
        const hasSlackService = await hasGrcService
          .hasSlackService()

        if (!hasSlackService) {
          this.emit('logged', output)

          return
        }

        await grcSlackFac
          .logError(null, output, '[bfx-report]')

        this.emit('logged', output)
      } catch (err) {
        this.emit('warn', err)
      }
    })()

    // Remark: Fire and forget here so requests dont cause buffering
    // and block more requests from happening
    if (callback) {
      setImmediate(callback)
    }
  }
}

const _getTransports = () => {
  if (!isProdEnv) {
    return {
      baseTransports: [
        new transports.Console({
          level: 'debug',
          colorize: false,
          handleExceptions: true
        }),
        new TransportSlack({
          level: 'error',
          colorize: false
        })
      ],
      exceptionHandlers: []
    }
  }

  return {
    baseTransports: [
      new transports.File({
        filename: pathError,
        level: 'error',
        maxsize: maxSize,
        colorize: false
      }),
      new TransportSlack({
        level: 'error',
        colorize: false
      })
    ],
    exceptionHandlers: [
      new transports.File({
        filename: pathExcLogger,
        maxsize: maxSize,
        colorize: false
      }),
      new transports.Console({
        colorize: false
      }),
      new TransportSlack({
        colorize: false
      })
    ]
  }
}

const _combineFormat = (colorize = !isProdEnv) => {
  return combine(
    label({ label: logLabel }),
    timestamp(),
    align(),
    printf(obj => {
      const str = `${obj.label}:${obj.level.toUpperCase()}`
      const ts = `[${obj.timestamp}]`

      if (colorize) {
        const colorStr = obj.level === 'error'
          ? str.red
          : str.blue
        const colorTs = ts.rainbow
        const colorMessage = obj.level === 'error'
          ? `${obj.message}`.red
          : `${obj.message}`.blue

        return `${colorStr} ${colorTs} ${colorMessage}`
      }

      return `${str} ${ts} ${obj.message}`
    })
  )
}

module.exports = ({ isLoggerDisabled }) => {
  const {
    baseTransports,
    exceptionHandlers
  } = _getTransports()

  return createLogger({
    format: _combineFormat(),
    transports: baseTransports,
    exceptionHandlers,
    silent: isLoggerDisabled || isTestEnv,
    exitOnError: true
  })
}
