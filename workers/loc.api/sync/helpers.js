'use strict'

const setProgress = (reportService, progress) => {
  reportService.ctx.grc_bfx.caller.syncProgress = progress
}

const getProgress = (reportService) => {
  return reportService.ctx.grc_bfx.caller.syncProgress
    ? reportService.ctx.grc_bfx.caller.syncProgress
    : 0
}

const collObjToArr = (coll = [], fieldName) => {
  const res = []

  coll.forEach(obj => {
    if (
      typeof obj === 'object' &&
      typeof obj[fieldName] !== 'undefined'
    ) {
      res.push(obj[fieldName])
    }
  })

  return res
}

const logErrorAndSetProgress = (reportService, err) => {
  const logger = reportService.ctx.grc_bfx.caller.logger

  setProgress(reportService, err.toString())
  logger.error(err.stack || err)
}

module.exports = {
  setProgress,
  getProgress,
  collObjToArr,
  logErrorAndSetProgress
}
