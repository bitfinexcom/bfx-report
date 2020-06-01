'use strict'

const hasJobInQueueWithStatusBy = require(
  './has-job-in-queue-with-status-by'
)

module.exports = async (
  rService,
  uId,
  user
) => {
  const { id } = { ...user }

  const userId = Number.isInteger(uId)
    ? uId
    : await hasJobInQueueWithStatusBy(rService, user)

  const userInfo = {
    ...user,
    userId: id
  }

  return {
    userId,
    userInfo
  }
}
