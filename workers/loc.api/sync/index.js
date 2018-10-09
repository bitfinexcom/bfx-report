'use strict'

const DataInserter = require('./data.inserter')
const {
  setProgress,
  getProgress,
  logErrorAndSetProgress,
  redirectRequestsToApi
} = require('./helpers')

let reportService = null

module.exports = async () => {
  let dataInserter = null

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

    dataInserter = new DataInserter(reportService)

    await dataInserter.insertNewDataToDbMultiUser()
  } catch (err) {
    await logErrorAndSetProgress(reportService, err)
  }

  try {
    await redirectRequestsToApi(reportService, false)
  } catch (err) {
    await logErrorAndSetProgress(reportService, err)
  }

  return getProgress(reportService)
}

module.exports.setReportService = (rService) => {
  reportService = rService
}
