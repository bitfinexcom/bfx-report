'use strict'

const {
  insertNewDataToDbMultiUser,
  setProgress,
  getProgress
} = require('./helpers')

let reportService = null
let isFirstRun = true

module.exports = async () => {
  if (getProgress(reportService) < 100 && !isFirstRun) {
    return
  }

  isFirstRun = false
  setProgress(reportService, 0)

  try {
    await insertNewDataToDbMultiUser(reportService)
  } catch (err) {
    console.error('Scheduler error: ', err)
  }

  setProgress(reportService, 100)
}

module.exports.setReportService = (rService) => {
  reportService = rService
}
