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
  if (!args.params || typeof args.params !== 'object') {
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

module.exports = {
  getREST,
  getLimitNotMoreThan,
  checkArgsAndAuth
}
