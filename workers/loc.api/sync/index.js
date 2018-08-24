'use strict'

const { checkNewData } = require('./helpers')

let reportService = null
let isFirstRun = true

// TODO:
module.exports = async () => {
  const wrk = reportService.ctx.grc_bfx.caller
  const group = wrk.group
  const conf = wrk.conf[group]

  if (wrk.syncProgress < 100 && !isFirstRun) {
    return
  }

  isFirstRun = false
  wrk.syncProgress = 0

  console.log('---start-sync--- ')

  const methodCollMap = await checkNewData(reportService, conf.auth)

  console.log('---stop-sync--- ')

  wrk.syncProgress = 100
}

module.exports.setReportService = (rService) => {
  reportService = rService
}
