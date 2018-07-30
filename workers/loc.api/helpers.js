'use strict'

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

const getLimitNotMoreThan = (limit, maxLimit = 25) => {
  const num = limit || maxLimit
  return Math.min(num, maxLimit)
}

const getParams = (args, maxLimit) => {
  const params = []
  if (args.params) {
    if (typeof args.params !== 'object') {
      throw new Error('ERR_ARGS_NO_PARAMS')
    }
    params.push(
      ...[
        args.params.symbol,
        args.params.start,
        args.params.end,
        getLimitNotMoreThan(args.params.limit, maxLimit)
      ]
    )
  }
  return params
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

const checkParams = (args) => {
  if (
    !args.params ||
    typeof args.params !== 'object' ||
    typeof args.params.email !== 'string' ||
    (args.params.limit && !Number.isInteger(args.params.limit)) ||
    (args.params.start && !Number.isInteger(args.params.start)) ||
    (args.params.end && !Number.isInteger(args.params.end))
  ) {
    throw new Error('ERR_ARGS_NO_PARAMS')
  }
}

module.exports = {
  getREST,
  getLimitNotMoreThan,
  getParams,
  isAllowMethod,
  checkParams
}
