'use strict'

const {
  insertNewDataToDb,
  setProgress,
  getProgress
} = require('./helpers')

let reportService = null
let isFirstRun = true

// TODO:
module.exports = async () => {
  const wrk = reportService.ctx.grc_bfx.caller
  const group = wrk.group
  const conf = wrk.conf[group]

  if (getProgress(reportService) < 100 && !isFirstRun) {
    return
  }

  isFirstRun = false
  setProgress(reportService, 0)

  console.log('---start-sync--- ')

  try {
    await insertNewDataToDb(reportService, conf.auth)
  } catch (err) {
    console.log('---err---', err)
  }

  console.log('---stop-sync--- ')

  setProgress(reportService, 100)
}

module.exports.setReportService = (rService) => {
  reportService = rService
}
