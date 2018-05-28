'use strict'

const cors = require('cors')
const config = require('config')

const enable =
  config.has('app.cors') &&
  config.has('app.cors.enable') &&
  config.get('app.cors.enable')

const corsBase = () => {
  if (!enable) {
    return (req, res, next) => next()
  }

  let whitelist = null

  if (config.has('app.cors.whitelist')) {
    whitelist = Array.isArray(config.get('app.cors.whitelist'))
      ? config.get('app.cors.whitelist')
      : null

    whitelist =
      typeof config.get('app.cors.whitelist') === 'string'
        ? config.get('app.cors.whitelist')
        : null
  }

  const originFn = function(origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }

  let origin = true

  if (whitelist === null) {
    origin = true
  } else {
    origin = Array.isArray(whitelist) ? originFn : whitelist
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
