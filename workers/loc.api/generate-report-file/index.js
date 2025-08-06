'use strict'

const {
  FILTER_API_METHOD_NAMES,
  normalizeFilterParams
} = require('../helpers')
const {
  getFilterValidationSchemaId
} = require('../helpers/prepare-response/helpers')
const {
  EmailSendingError,
  GrcPDFAvailabilityError
} = require('../errors')
const getLocalReportFolderPaths = require(
  '../queue/helpers/get-local-report-folder-paths'
)

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

const _filterApiMethodNameMap = Object.values(FILTER_API_METHOD_NAMES)
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

const _getfilterApiMethodNamesAndArgs = (
  name,
  reqArgs
) => {
  if (name !== 'getMultipleFileJobData') {
    const filterApiMethodName = _filterApiMethodNameMap.get(name)
    const truncatedName = _truncateFileNameEnding(name)
    const args = normalizeFilterParams(truncatedName, reqArgs)

    return [{
      filterApiMethodName,
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
    const filterApiMethodName = _filterApiMethodNameMap.get(name)

    return {
      filterApiMethodName,
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
  conf,
  dataValidator
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
  const checkingDataArr = _getfilterApiMethodNamesAndArgs(
    name,
    args
  )

  for (const { filterApiMethodName, args } of checkingDataArr) {
    const filterSchemaId = getFilterValidationSchemaId(filterApiMethodName)
    await dataValidator.validate(
      { params: args?.params?.filter },
      filterSchemaId
    )
  }

  const getter = reportFileJobData[name].bind(reportFileJobData)
  const jobData = await getter(args, null, user)

  processorQueue.addJob(jobData)

  return status
}
