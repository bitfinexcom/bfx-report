'use strict'

const DataInserter = require('./data.inserter')
const {
  setProgress,
  getProgress,
  logErrorAndSetProgress
} = require('./helpers')

let reportService = null
let isFirstRun = true

const progressHandler = (progress) => {
  setProgress(reportService, progress)
}

module.exports = async () => {
  let dataInserter = null

  try {
    const isEnable = await reportService.isSchedulerEnabled()

    if (
      (getProgress(reportService) < 100 && !isFirstRun) ||
      !isEnable
    ) {
      return
    }

    isFirstRun = false

    setProgress(reportService, 0)
    await reportService.dao.updateStateOf('syncMode', false)

    dataInserter = new DataInserter(reportService)
    dataInserter.on('progress', progressHandler)

    await dataInserter.insertNewDataToDbMultiUser()
  } catch (err) {
    logErrorAndSetProgress(reportService, err)
  }

  if (dataInserter) {
    dataInserter.removeListener('progress', progressHandler)
  }

  try {
    await reportService.dao.updateStateOf('syncMode', true)
  } catch (err) {
    logErrorAndSetProgress(reportService, err)
  }
}

module.exports.setReportService = (rService) => {
  reportService = rService
}
