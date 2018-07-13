'use strict'

const { promisify } = require('util')
const _ = require('lodash')
const bfxFactory = require('./bfx.factory')

const getREST = (auth, wrkReportServiceApi) => {
  if (typeof auth !== 'object') {
    throw new Error('ERR_ARGS_NO_AUTH_DATA')
  }

  const group = wrkReportServiceApi.group
  const conf = wrkReportServiceApi.conf[group]

  const bfx = bfxFactory({ conf, ...auth })

  return bfx.rest(2, { transform: true })
}

const getLimitNotMoreThan = (limit, maxLimit = 10000) => {
  if (
    Number.isFinite(limit) &&
    limit < maxLimit
  ) {
    return limit
  }

  return null
}

const checkArgsAndAuth = async (args, cb) => {
  if (
    !args.params ||
    typeof args.params !== 'object' ||
    typeof args.params.symbol !== 'string' ||
    typeof args.params.start !== 'number' ||
    typeof args.params.end !== 'number'
  ) {
    throw new Error('ERR_ARGS_NO_PARAMS')
  }
  const testAuthArgs = _.cloneDeep(args)

  testAuthArgs.params.limit = 1
  testAuthArgs.params.start = undefined
  testAuthArgs.params.end = (new Date()).getTime()

  const checkAuth = promisify(cb)
  const resAuth = await checkAuth(null, testAuthArgs)

  if (!resAuth) {
    throw new Error('ERR_AUTH_UNAUTHORIZED')
  }

  return Promise.resolve(resAuth)
}

const isAllowMethod = (ctx) => {
  if (
    ctx.grc_bfx &&
    ctx.grc_bfx.caller &&
    ctx.grc_bfx.caller.conf &&
    ctx.grc_bfx.caller.conf.app_type === 'electron'
  ) {
    throw new Error('ERR_API_ACTION_NOTFOUND')
  }

  return true
}

module.exports = {
  getREST,
  getLimitNotMoreThan,
  checkArgsAndAuth,
  isAllowMethod
}
