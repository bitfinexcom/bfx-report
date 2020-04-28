'use strict'

const { QueueJobAddingError } = require('../errors')

module.exports = async (
  rService,
  user,
  statuses = ['ACTIVE', 'PROCESSING']
) => {
  const ctx = rService.ctx
  const wrk = ctx.grc_bfx.caller
  const group = wrk.group
  const {
    syncMode,
    isSpamRestrictionMode
  } = { ...wrk.conf[group] }

  if (
    syncMode ||
    !isSpamRestrictionMode
  ) {
    return null
  }

  const { id } = { ...user }

  const procQ = ctx.lokue_processor.q
  const aggrQ = ctx.lokue_aggregator.q

  const hasJobInQueue = !(statuses.every(status => {
    return [procQ, aggrQ].every(queue => {
      const jobs = queue.listJobs(status)

      if (!Array.isArray(jobs)) {
        return true
      }

      return jobs.every(job => (
        typeof job === 'object' &&
        typeof job.data === 'object' &&
        typeof job.data.userId !== 'undefined' &&
        job.data.userId !== id
      ))
    })
  }))

  if (hasJobInQueue) {
    throw new QueueJobAddingError()
  }

  return id
}
