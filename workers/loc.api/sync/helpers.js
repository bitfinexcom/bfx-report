'use strict'

const { isEmpty } = require('lodash')

const ALLOWED_COLLS = require('./allowed.colls')

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
  state = true
) => {
  await reportService.dao.updateStateOf('syncMode', !state)
}

const delay = (mc = 80000) => {
  return new Promise((resolve) => {
    setTimeout(resolve, mc)
  })
}

const checkCollPermission = (syncColls, notThrowError) => {
  if (
    !syncColls ||
    !Array.isArray(syncColls) ||
    syncColls.length === 0 ||
    syncColls.some(item => (
      !item ||
      typeof item !== 'string' ||
      Object.values(ALLOWED_COLLS).every(collName => item !== collName)
    ))
  ) {
    const mess = 'ERR_PERMISSION_DENIED_TO_SYNC_SELECTED_COLLS'

    if (notThrowError) {
      return mess
    }

    throw new Error(mess)
  }
}

module.exports = {
  setProgress,
  getProgress,
  collObjToArr,
  logErrorAndSetProgress,
  redirectRequestsToApi,
  delay,
  checkCollPermission
}
