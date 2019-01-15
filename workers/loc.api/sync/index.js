'use strict'

const syncQueue = require('./sync.queue')
const {
  setProgress,
  getProgress,
  logErrorAndSetProgress,
  redirectRequestsToApi
} = require('./helpers')
const { CollSyncPermissionError } = require('../errors')
const { ALLOWED_COLLS } = require('./allowed.colls')

let reportService = null

const _sync = async (isSkipSync) => {
  if (!isSkipSync) {
    try {
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

module.exports.setReportService = (rService) => {
  reportService = rService

  syncQueue.injectDeps(rService)
}
