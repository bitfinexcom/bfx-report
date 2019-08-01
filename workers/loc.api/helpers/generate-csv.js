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

module.exports = (
  rService,
  processorQueue,
  hasGrcService
) => async (
  name,
  args
) => {
  const status = await _getCsvStoreStatus(
    hasGrcService,
    args
  )
  const _getCsvJobData = {
    ...getCsvJobData,
    ...args.getCsvJobData
  }
  const getter = _getCsvJobData[name].bind(getCsvJobData)
  const jobData = await getter(rService, args)

  processorQueue.addJob(jobData)

  return status
}
