'use strict'

const { isEmpty } = require('lodash')

const setProgress = (reportService, progress) => {
  return reportService.dao.updateProgress(progress)
}

const getProgress = async (reportService) => {
  const progress = await reportService.dao.getFirstElemInCollBy('progress')

  return (!isEmpty(progress) && typeof progress.value === 'string')
    ? JSON.parse(progress.value)
    : 'SYNCHRONIZATION_HAS_NOT_STARTED_YET'
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

const logErrorAndSetProgress = async (reportService, err) => {
  const logger = reportService.ctx.grc_bfx.caller.logger

  try {
    await setProgress(reportService, err.toString())
  } catch (e) {
    logger.error(e.stack || e)
  }

  logger.error(err.stack || err)
}

const redirectRequestsToApi = async (
  reportService,
  isNeedToRedirectRequestsToApi,
  state = true
) => {
  if (isNeedToRedirectRequestsToApi) {
    await reportService.dao.updateStateOf('syncMode', !state)
  }
}

const isNeedToRedirectRequestsToApi = async (reportService) => {
  const firstElem = await reportService.dao.getFirstElemInCollBy('syncMode')

  return !isEmpty(firstElem) && !!firstElem.isEnable
}

module.exports = {
  setProgress,
  getProgress,
  collObjToArr,
  logErrorAndSetProgress,
  redirectRequestsToApi,
  isNeedToRedirectRequestsToApi
}
