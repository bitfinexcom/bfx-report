'use strict'

let reportService = null

const sync = require('./sync')

// TODO:
module.exports = async (isSolveAfterRedirToApi, syncColls) => {
  return sync(isSolveAfterRedirToApi, syncColls)
}

module.exports.setReportService = (rService) => {
  reportService = rService

  sync.setReportService(rService)
}
