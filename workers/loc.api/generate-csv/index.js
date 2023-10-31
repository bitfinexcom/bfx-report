'use strict'

const {
  checkFilterParams,
  FILTER_MODELS_NAMES,
  normalizeFilterParams
} = require('../helpers')
const {
  EmailSendingError
} = require('../errors')
const getLocalCsvFolderPaths = require(
  '../queue/helpers/get-local-csv-folder-paths'
)

const _getCsvStoreStatus = async ({
  hasGrcService,
  args,
  rootPath,
  conf
} = {}) => {
  const email = args?.params?.email
  const token = args?.auth?.token

  if (
    !email ||
    typeof email !== 'string'
  ) {
    const {
      localCsvFolderPath
    } = getLocalCsvFolderPaths(rootPath)
    const remoteCsvUrn = (
      token &&
      typeof token === 'string' &&
      conf?.remoteCsvUrn &&
      typeof conf?.remoteCsvUrn === 'string'
    )
      ? `${conf?.remoteCsvUrn}?token=${token}`
      : null

    return {
      isSaveLocaly: true,
      localCsvFolderPath,
      remoteCsvUrn
    }
  }

  if (!await hasGrcService.hasS3AndSendgrid()) {
    throw new EmailSendingError()
  }

  return { isSendEmail: true }
}

const _filterModelNameMap = Object.values(FILTER_MODELS_NAMES)
  .reduce((map, name) => {
    const baseName = `${name[0].toUpperCase()}${name.slice(1)}`
    const key = `get${baseName}CsvJobData`

    map.set(key, name)

    return map
  }, new Map())

const _truncateCsvNameEnding = (name) => {
  if (!name) {
    return name
  }

  const cleanedName = name
    .replace(/^get/i, '')
    .replace(/csv$/i, '')

  return `${cleanedName[0].toLowerCase()}${cleanedName.slice(1)}`
}

const _getFilterModelNamesAndArgs = (
  name,
  reqArgs
) => {
  if (name !== 'getMultipleCsvJobData') {
    const filterModelName = _filterModelNameMap.get(name)
    const truncatedName = _truncateCsvNameEnding(name)
    const args = normalizeFilterParams(truncatedName, reqArgs)

    return [{
      filterModelName,
      args
    }]
  }

  const { params } = { ...reqArgs }
  const { multiExport } = { ...params }
  const _multiExport = Array.isArray(multiExport)
    ? multiExport
    : []

  return _multiExport.map((params) => {
    const { method } = { ...params }
    const name = `${method}JobData`
    const truncatedName = _truncateCsvNameEnding(method)
    const args = normalizeFilterParams(truncatedName, { params })
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
  rootPath,
  conf
) => async (
  name,
  args
) => {
  const user = await rService.verifyUser(null, args)

  const status = await _getCsvStoreStatus({
    hasGrcService,
    args,
    rootPath,
    conf
  })
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
