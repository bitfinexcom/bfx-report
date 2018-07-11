'use strict'

const path = require('path')
const _ = require('lodash')
const fs = require('fs')
const serviceRoot = path.join(__dirname, '..')

const getJSONConf = (env, type, path) => {
  const conf = JSON.parse(fs.readFileSync(path, 'utf8'))

  if (!_.isObject(conf)) {
    return {}
  }

  let res = {}

  if (type) {
    _.set(res, type, conf[env] ? conf[env] : conf)
  } else {
    res = conf
  }

  return res
}

process.env.TZ = 'UTC'

const runWorker = (
  cmd = {
    wtype: 'wrk-report-service-api',
    env: 'development',
    apiPort: 1337,
    debug: false
  }
) => {
  const { wtype, env } = cmd

  const conf = _.merge(
    {},
    getJSONConf(env, null, `${serviceRoot}/config/common.json`)
  )

  const wref = wtype.split('-').reverse()
  const ctx = {
    root: serviceRoot,
    wtype: wtype,
    env: env
  }

  _.each(cmd, (v, k) => {
    ctx[_.camelCase(k)] = v
  })

  const pname = [wtype]

  pname.push(process.pid)
  process.title = pname.join('-')

  const HandlerClass = require(path.join(
    serviceRoot,
    '/workers/',
    wref.join('.')
  ))
  const hnd = new HandlerClass(conf, ctx)

  return hnd
}

module.exports = {
  runWorker
}
