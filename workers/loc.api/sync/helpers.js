'use strict'

const setProgress = (reportService, progress) => {
  reportService.ctx.grc_bfx.caller.syncProgress = progress
}

const getProgress = (reportService) => {
  return reportService.ctx.grc_bfx.caller.syncProgress
    ? reportService.ctx.grc_bfx.caller.syncProgress
    : 0
}

module.exports = {
  setProgress,
  getProgress
}
