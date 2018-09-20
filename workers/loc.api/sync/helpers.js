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

module.exports = {
  setProgress,
  getProgress,
  collObjToArr
}
