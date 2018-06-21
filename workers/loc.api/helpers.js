'use strict'

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

const jobResolver = async (ctx, method, args, propName) => {
  const processorQueue = ctx.bull_processor.queue
  const aggregatorQueue = ctx.bull_aggregator.queue

  const processorJob = await processorQueue.add({
    method,
    args,
    propName
  })
  const resProc = await processorJob.finished()

  const aggregatorJob = await aggregatorQueue.add(resProc)

  return aggregatorJob.finished()
}

module.exports = {
  getREST,
  getLimitNotMoreThan,
  jobResolver
}
