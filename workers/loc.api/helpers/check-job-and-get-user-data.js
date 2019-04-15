'use strict'

const hasJobInQueueWithStatusBy = require(
  './has-job-in-queue-with-status-by'
)

module.exports = async (
  reportService,
  args,
  uId,
  uInfo
) => {
  const userId = Number.isInteger(uId)
    ? uId
    : await hasJobInQueueWithStatusBy(reportService, args)
  const userInfo = uInfo && typeof uInfo === 'string'
    ? uInfo
    : await reportService._getUsername(args)

  return {
    userId,
    userInfo
  }
}
