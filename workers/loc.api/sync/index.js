'use strict'

const {
  setProgress,
  getProgress,
  logErrorAndSetProgress,
  redirectRequestsToApi
} = require('./helpers')
const { CollSyncPermissionError } = require('../errors')
const ALLOWED_COLLS = require('./allowed.colls')

let reportService = null
let syncQueueFactory = null

const _sync = async (isSkipSync) => {
  if (!isSkipSync) {
    try {
      const syncQueue = syncQueueFactory(true)

      await syncQueue.process()
    } catch (err) {
      await logErrorAndSetProgress(reportService, err)
    }
  }

  try {
    await redirectRequestsToApi(reportService, false)
  } catch (err) {
    await logErrorAndSetProgress(reportService, err)
  }

  return getProgress(reportService)
}

module.exports = async (
  isSolveAfterRedirToApi,
  syncColls = ALLOWED_COLLS.ALL
) => {
  let isSkipSync = false

  try {
    const isEnable = await reportService.isSchedulerEnabled()
    const currProgress = await getProgress(reportService)

    if (isEnable) {
      const syncQueue = syncQueueFactory(true)

      await syncQueue.add(syncColls)
    }
    if (
      (currProgress < 100) ||
      !isEnable
    ) {
      return getProgress(reportService)
    }

    await reportService.pingApi()

    await setProgress(reportService, 0)
    await redirectRequestsToApi(reportService, true)
  } catch (err) {
    if (err instanceof CollSyncPermissionError) {
      throw err
    }

    isSkipSync = true

    await logErrorAndSetProgress(reportService, err)
  }

  if (!isSkipSync && isSolveAfterRedirToApi) {
    _sync(isSkipSync).then(() => {}, () => {})

    return 'SYNCHRONIZATION_IS_STARTED'
  }

  return _sync(isSkipSync)
}

module.exports.injectDeps = (
  rService,
  sQueueFactory
) => {
  reportService = rService
  syncQueueFactory = sQueueFactory
}
