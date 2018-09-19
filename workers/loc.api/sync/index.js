'use strict'

const DataInserter = require('./data.inserter')
const {
  setProgress,
  getProgress
} = require('./helpers')

let reportService = null
let isFirstRun = true

module.exports = async () => {
  const isEnable = await reportService.isEnableScheduler()

  if (
    (getProgress(reportService) < 100 && !isFirstRun) ||
    !isEnable
  ) {
    return
  }

  isFirstRun = false
  setProgress(reportService, 0)

  try {
    const dataInserter = new DataInserter(reportService)
    await dataInserter.insertNewDataToDbMultiUser()
  } catch (err) {
    setProgress(reportService, err.toString())
    console.log('Scheduler error: ', err)
  }
}

module.exports.setReportService = (rService) => {
  reportService = rService
}
