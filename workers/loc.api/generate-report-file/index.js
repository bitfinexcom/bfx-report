'use strict'

const {
  checkFilterParams,
  FILTER_MODELS_NAMES,
  normalizeFilterParams
} = require('../helpers')
const {
  EmailSendingError,
  GrcPDFAvailabilityError
} = require('../errors')
const getLocalReportFolderPaths = require(
  '../queue/helpers/get-local-report-folder-paths'
)
const { isElectronjsEnv } = require('../queue/helpers/utils')

const _getReportFileStoreStatus = async ({
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
    if (conf.isHosted) {
      throw new EmailSendingError()
    }

    const {
      localReportFolderPath
    } = getLocalReportFolderPaths(rootPath)
    const remoteReportUrn = (
      token &&
      typeof token === 'string' &&
      conf?.remoteReportUrn &&
      typeof conf?.remoteReportUrn === 'string'
    )
      ? `${conf?.remoteReportUrn}?token=${token}`
      : null

    return {
      isSaveLocaly: true,
      localReportFolderPath,
      remoteReportUrn
    }
  }

  if (!await hasGrcService.hasS3AndSendgrid()) {
    throw new EmailSendingError()
  }
  if (
    args?.params?.isPDFRequired &&
    !await hasGrcService.hasPDFService()
  ) {
    throw new GrcPDFAvailabilityError()
  }

  return { isSendEmail: true }
}

const _filterModelNameMap = Object.values(FILTER_MODELS_NAMES)
  .reduce((map, name) => {
    const baseName = `${name[0].toUpperCase()}${name.slice(1)}`
    const key = `get${baseName}FileJobData`

    map.set(key, name)

    return map
  }, new Map())

const _truncateFileNameEnding = (name) => {
  if (!name) {
    return name
  }

  const cleanedName = name
    .replace(/^get/i, '')
    .replace(/(file)|(csv)$/i, '')

  return `${cleanedName[0].toLowerCase()}${cleanedName.slice(1)}`
}

const _getFilterModelNamesAndArgs = (
  name,
  reqArgs
) => {
  if (name !== 'getMultipleFileJobData') {
    const filterModelName = _filterModelNameMap.get(name)
    const truncatedName = _truncateFileNameEnding(name)
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
    const truncatedName = _truncateFileNameEnding(method)
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
  reportFileJobData,
  rService,
  rootPath,
  conf
) => async (
  name,
  args
) => {
  const user = await rService.verifyUser(null, args)

  const status = await _getReportFileStoreStatus({
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

  const getter = reportFileJobData[name].bind(reportFileJobData)
  const jobData = await getter(args, null, user)

  processorQueue.addJob(jobData)

  return status
}
