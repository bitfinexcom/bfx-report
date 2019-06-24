'use strict'

const { isEmpty } = require('lodash')

const { CollSyncPermissionError } = require('../errors')
const ALLOWED_COLLS = require('./allowed.colls')
const WSEventEmitter = require('../ws-transport/ws.event.emitter')

const wsEventEmitter = new WSEventEmitter()

const setProgress = async (reportService, progress) => {
  await reportService.dao.updateProgress(progress)
  await wsEventEmitter.emitProgress(() => progress)
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

const checkCollPermission = (syncColls, allowedColls = ALLOWED_COLLS) => {
  if (
    !syncColls ||
    !Array.isArray(syncColls) ||
    syncColls.length === 0 ||
    syncColls.some(item => (
      !item ||
      typeof item !== 'string' ||
      Object.values(allowedColls).every(collName => item !== collName)
    ))
  ) {
    throw new CollSyncPermissionError()
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
