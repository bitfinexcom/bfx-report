'use strict'

const { upperFirst } = require('lodash')

const {
  checkFilterParams,
  FILTER_MODELS_NAMES
} = require('../helpers')
const {
  EmailSendingError
} = require('../errors')
const getLocalCsvFolderPaths = require(
  '../queue/helpers/get-local-csv-folder-paths'
)

const _getCsvStoreStatus = async (
  hasGrcService,
  args,
  rootPath
) => {
  const { email } = { ...args.params }

  if (
    !email ||
    typeof email !== 'string'
  ) {
    const {
      localCsvFolderPath
    } = getLocalCsvFolderPaths(rootPath)

    return {
      isSaveLocaly: true,
      localCsvFolderPath
    }
  }

  if (!await hasGrcService.hasS3AndSendgrid()) {
    throw new EmailSendingError()
  }

  return { isSendEmail: true }
}

const _filterModelNameMap = Object.values(FILTER_MODELS_NAMES)
  .reduce((map, name) => {
    const key = `get${upperFirst(name)}CsvJobData`

    map.set(key, name)

    return map
  }, new Map())

const _getFilterModelNamesAndArgs = (
  name,
  args
) => {
  if (name !== 'getMultipleCsvJobData') {
    const filterModelName = _filterModelNameMap.get(name)

    return [{
      filterModelName,
      args
    }]
  }

  const { params } = { ...args }
  const { multiExport } = { ...params }
  const _multiExport = Array.isArray(multiExport)
    ? multiExport
    : []

  return _multiExport.map((params) => {
    const { method } = { ...params }
    const name = `${method}JobData`
    const args = { params }
    const filterModelName = _filterModelNameMap.get(name)

    return {
      filterModelName,
      args
    }
  })
}

module.exports = (
  processorQueue,
  hasGrcService,
  csvJobData,
  rService,
  rootPath
) => async (
  name,
  args
) => {
  const user = await rService.verifyUser(null, args)

  const status = await _getCsvStoreStatus(
    hasGrcService,
    args,
    rootPath
  )
  const checkingDataArr = _getFilterModelNamesAndArgs(
    name,
    args
  )

  for (const { filterModelName, args } of checkingDataArr) {
    checkFilterParams(filterModelName, args)
  }

  const getter = csvJobData[name].bind(csvJobData)
  const jobData = await getter(args, null, user)

  processorQueue.addJob(jobData)

  return status
}
