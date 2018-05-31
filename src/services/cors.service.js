'use strict'

const cors = require('cors')
const config = require('config')

const enable =
  config.has('app.cors') &&
  config.has('app.cors.enable') &&
  config.get('app.cors.enable')

const _getWhitelist = (confPath = 'app.cors.whitelist') => {
  if (Array.isArray(config.get(confPath))) {
    return config.get(confPath)
  }

  if (typeof config.get(confPath) === 'string') {
    return [config.get(confPath)]
  }

  return null
}

const corsBase = () => {
  if (!enable) {
    return (req, res, next) => next()
  }

  let whitelist = _getWhitelist()

  const originFn = (origin, callback) => {
    console.log('---origin---', origin) // TODO:
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)

      return
    }

    callback(new Error('Not allowed by CORS'))
  }

  let origin = true

  console.log('---whitelist---', whitelist) // TODO:
  if (whitelist !== null) {
    origin = originFn
  }

  const corsOptions = {
    origin,
    methods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }

  return cors(corsOptions)
}

module.exports = {
  corsBase
}
