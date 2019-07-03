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

  const {
    username,
    email,
    id
  } = { ...uInfo }
  const _userInfo = (
    username && typeof username === 'string' &&
    email && typeof email === 'string' &&
    Number.isInteger(id)
  )
    ? uInfo
    : await reportService._getUserInfo(args)
  const userInfo = {
    ..._userInfo,
    userId: _userInfo.id
  }

  return {
    userId,
    userInfo
  }
}
