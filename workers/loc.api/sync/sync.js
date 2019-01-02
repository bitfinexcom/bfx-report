'use strict'

const DataInserter = require('./data.inserter')
const {
  setProgress,
  getProgress,
  logErrorAndSetProgress,
  redirectRequestsToApi
} = require('./helpers')

let reportService = null

const _sync = async (isSkipSync, syncColls) => {
  let dataInserter = null

  if (!isSkipSync) {
    try {
      dataInserter = new DataInserter(reportService, syncColls)

      await dataInserter.insertNewDataToDbMultiUser()
    } catch (err) {
      await logErrorAndSetProgress(reportService, err)
    }
  }

  try {
    await redirectRequestsToApi(reportService, false)
  } catch (err) {
    await logErrorAndSetProgress(reportService, err)
  }

  return getProgress(reportService)
}

module.exports = async (isSolveAfterRedirToApi, syncColls) => {
  let isSkipSync = false

  try {
    const isEnable = await reportService.isSchedulerEnabled()
    const currProgress = await getProgress(reportService)

    if (
      (currProgress < 100) ||
      !isEnable
    ) {
      return getProgress(reportService)
    }

    await reportService.pingApi()

    await setProgress(reportService, 0)
    await redirectRequestsToApi(reportService, true)
  } catch (err) {
    isSkipSync = true

    await logErrorAndSetProgress(reportService, err)
  }

  if (!isSkipSync && isSolveAfterRedirToApi) {
    _sync(isSkipSync, syncColls).then(() => {}, () => {})

    return 'SYNCHRONIZATION_IS_STARTED'
  }

  return _sync(isSkipSync, syncColls)
}

module.exports.setReportService = (rService) => {
  reportService = rService
}
