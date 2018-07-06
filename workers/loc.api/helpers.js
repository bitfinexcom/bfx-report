'use strict'

const { promisify } = require('util')
const bfxFactory = require('./bfx.factory')

const getREST = (auth) => {
  if (typeof auth !== 'object') {
    throw new Error('ERR_ARGS_NO_AUTH_DATA')
  }

  const bfx = bfxFactory({ ...auth })

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
    typeof args.params.email !== 'string'
  ) {
    throw new Error('ERR_ARGS_NO_PARAMS')
  }

  args.params.limit = 1
  args.params.start = undefined
  args.params.end = (new Date()).getTime()

  const checkAuth = promisify(cb)
  const resAuth = await checkAuth(null, args)

  if (!resAuth) {
    throw new Error('ERR_AUTH_UNAUTHORIZED')
  }

  args.params.limit = undefined

  return Promise.resolve(resAuth)
}

const isAllowMethod = (ctx) => {
  if (
    ctx.grc_bfx &&
    ctx.grc_bfx.caller &&
    ctx.grc_bfx.caller.conf &&
    ctx.grc_bfx.caller.conf.isElectronEnv
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
