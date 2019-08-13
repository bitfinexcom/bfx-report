'use strict'

const {
  EmailSendingError
} = require('../errors')

const _getCsvStoreStatus = async (
  hasGrcService,
  args
) => {
  const { email } = { ...args.params }

  if (
    !email ||
    typeof email !== 'string'
  ) {
    return { isSaveLocaly: true }
  }

  if (!await hasGrcService.hasS3AndSendgrid()) {
    throw new EmailSendingError()
  }

  return { isSendEmail: true }
}

module.exports = (
  processorQueue,
  hasGrcService,
  csvJobData
) => async (
  name,
  args
) => {
  const status = await _getCsvStoreStatus(
    hasGrcService,
    args
  )

  const getter = csvJobData[name].bind(csvJobData)
  const jobData = await getter(args)

  processorQueue.addJob(jobData)

  return status
}
