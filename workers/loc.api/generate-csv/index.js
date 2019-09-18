'use strict'

const { upperFirst } = require('lodash')

const {
  checkFilterParams,
  FILTER_MODELS_NAMES
} = require('../helpers')
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

const _filterModelNameMap = Object.values(FILTER_MODELS_NAMES)
  .reduce((map, name) => {
    const key = `get${upperFirst(name)}CsvJobData`

    map.set([key, name])

    return map
  }, new Map())

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
  const filterModelName = _filterModelNameMap.get(name)

  checkFilterParams(filterModelName, args)

  const getter = csvJobData[name].bind(csvJobData)
  const jobData = await getter(args)

  processorQueue.addJob(jobData)

  return status
}
