'use strict'

let reportService = null
let isFirstRun = true
let count = 0

// TODO:
module.exports = async () => {
  count += 1
  const currId = count
  const wReportServApi = reportService.ctx.grc_bfx.caller

  if (wReportServApi.syncProgress < 100 && !isFirstRun) {
    return
  }

  isFirstRun = false
  wReportServApi.syncProgress = 0

  // TODO:
  console.log('---start-sync--- ', currId)
  await new Promise((resolve) => {
    setTimeout(resolve, 6000)
  })
  console.log('---stop-sync--- ', currId)

  wReportServApi.syncProgress = 100
}

module.exports.setReportService = (rService) => {
  reportService = rService
}
