'use strict'

const { QueueJobAddingError } = require('../errors')

module.exports = async (
  reportService,
  args,
  statuses = ['ACTIVE', 'PROCESSING']
) => {
  const ctx = reportService.ctx
  const wrk = ctx.grc_bfx.caller
  const group = wrk.group
  const conf = wrk.conf[group]

  if (
    conf.syncMode ||
    !conf.isSpamRestrictionMode
  ) {
    await reportService.verifyUser(null, args)

    return null
  }

  const userInfo = await reportService._getUserInfo(args)

  const procQ = ctx.lokue_processor.q
  const aggrQ = ctx.lokue_aggregator.q

  const hasJobInQueue = !(statuses.every(status => {
    return [procQ, aggrQ].every(queue => {
      const jobs = queue.listJobs(status)

      if (!Array.isArray(jobs)) {
        return true
      }

      return jobs.every(job => {
        return (
          typeof job === 'object' &&
          typeof job.data === 'object' &&
          typeof job.data.userId !== 'undefined' &&
          job.data.userId !== userInfo.id
        )
      })
    })
  }))

  if (hasJobInQueue) {
    throw new QueueJobAddingError()
  }

  return userInfo.id
}
