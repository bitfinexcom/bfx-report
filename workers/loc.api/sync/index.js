'use strict'

const DataInserter = require('./data.inserter')
const {
  setProgress,
  getProgress
} = require('./helpers')

let reportService = null
let isFirstRun = true

const progressHandler = (progress) => {
  setProgress(reportService, progress)
}

module.exports = async () => {
  const isEnable = await reportService.isSchedulerEnabled()
  let dataInserter = null

  if (
    (getProgress(reportService) < 100 && !isFirstRun) ||
    !isEnable
  ) {
    return
  }

  isFirstRun = false
  setProgress(reportService, 0)

  try {
    dataInserter = new DataInserter(reportService)
    dataInserter.on('progress', progressHandler)

    await dataInserter.insertNewDataToDbMultiUser()
  } catch (err) {
    setProgress(reportService, err.toString())

    const logger = reportService.ctx.grc_bfx.caller.logger
    logger.error(err.stack || err)
  }

  if (dataInserter) {
    dataInserter.removeListener('progress', progressHandler)
  }
}

module.exports.setReportService = (rService) => {
  reportService = rService
}
