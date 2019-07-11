'use strict'

const getCsvJobData = require('./get-csv-job-data')
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

module.exports = async (
  rService,
  processorQueue,
  hasGrcService,
  name,
  args
) => {
  const status = await _getCsvStoreStatus(
    hasGrcService,
    args
  )
  const getter = getCsvJobData[name].bind(getCsvJobData)
  const jobData = await getter(rService, args)

  processorQueue.addJob(jobData)

  return status
}
