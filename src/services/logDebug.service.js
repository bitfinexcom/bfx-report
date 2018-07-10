'use strict'

const debug = require('debug')
const config = require('config')

const prefix = ''
const postfix = process.env.NODE_ENV === 'development' ? ':app-dev' : ':app'

const isEnable = config.has('enableLogDebug') && config.get('enableLogDebug')
const enableInfo = isEnable
const enableDev = isEnable
const enableError = isEnable

let _token = []

const infoToken = `${prefix}info${postfix}`
const devToken = `${prefix}dev${postfix}`
const errorToken = `${prefix}error${postfix}`

if (enableInfo) {
  _token.push(`${infoToken}`)
  _token.push(`${infoToken}:*`)
}

if (enableDev) {
  _token.push(`${devToken}`)
  _token.push(`${devToken}:*`)
}

if (enableError) {
  _token.push(`${errorToken}`)
  _token.push(`${errorToken}:*`)
}

if (_token.length > 0) {
  debug.enable(_token.join(','))
}

const info = debug(infoToken)
const dev = debug(devToken)
const error = debug(errorToken)

info.log = console.info.bind(console)
dev.log = console.info.bind(console)
error.log = console.error.bind(console)

module.exports = {
  info,
  error,
  debug: dev
}
