'use strict'

require('colors')
const path = require('path')
const argv = require('yargs').argv
const {
  createLogger,
  format,
  transports
} = require('winston')
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

const baseTransports = []
const exceptionHandlers = []

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

if (isProdEnv) {
  baseTransports.push(
    new transports.File({
      filename: pathError,
      level: 'error',
      maxsize: maxSize,
      colorize: false
    })
  )
  exceptionHandlers.push(
    new transports.File({
      filename: pathExcLogger,
      maxsize: maxSize,
      colorize: false
    }),
    new transports.Console({
      colorize: false
    })
  )
} else {
  baseTransports.push(
    new transports.Console({
      level: 'debug',
      colorize: false,
      handleExceptions: true
    })
  )
}

module.exports = ({ isLoggerDisabled }) => {
  return createLogger({
    format: _combineFormat(),
    transports: baseTransports,
    exceptionHandlers,
    silent: isLoggerDisabled || isTestEnv,
    exitOnError: true
  })
}
