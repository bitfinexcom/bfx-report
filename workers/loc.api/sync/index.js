'use strict'

const DataInserter = require('./data.inserter')
const {
  setProgress,
  getProgress,
  logErrorAndSetProgress,
  isNeedToRedirectRequestsToApi,
  redirectRequestsToApi
} = require('./helpers')

let reportService = null

module.exports = async () => {
  let dataInserter = null
  let _isNeedToRedirectRequestsToApi = false

  try {
    const isEnable = await reportService.isSchedulerEnabled()
    const currProgress = await getProgress(reportService)

    if (
      (currProgress < 100) ||
      !isEnable
    ) {
      return getProgress(reportService)
    }

    await setProgress(reportService, 0)
    _isNeedToRedirectRequestsToApi = await isNeedToRedirectRequestsToApi(reportService)
    await redirectRequestsToApi(reportService, _isNeedToRedirectRequestsToApi, true)

    dataInserter = new DataInserter(reportService)

    await dataInserter.insertNewDataToDbMultiUser()
  } catch (err) {
    await logErrorAndSetProgress(reportService, err)
  }

  try {
    await redirectRequestsToApi(reportService, _isNeedToRedirectRequestsToApi, false)
  } catch (err) {
    await logErrorAndSetProgress(reportService, err)
  }

  return getProgress(reportService)
}

module.exports.setReportService = (rService) => {
  reportService = rService
}
