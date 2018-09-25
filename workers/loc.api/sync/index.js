'use strict'

const DataInserter = require('./data.inserter')
const {
  setProgress,
  getProgress,
  logErrorAndSetProgress
} = require('./helpers')

let reportService = null

const progressHandler = async (progress) => {
  await setProgress(reportService, progress)
}

module.exports = async () => {
  let dataInserter = null

  try {
    const isEnable = await reportService.isSchedulerEnabled()

    if (
      (await getProgress(reportService) < 100) ||
      !isEnable
    ) {
      return
    }

    await setProgress(reportService, 0)
    await reportService.dao.updateStateOf('syncMode', false)

    dataInserter = new DataInserter(reportService)
    dataInserter.on('progress', progressHandler)

    await dataInserter.insertNewDataToDbMultiUser()
  } catch (err) {
    await logErrorAndSetProgress(reportService, err)
  }

  if (dataInserter) {
    dataInserter.removeListener('progress', progressHandler)
  }

  try {
    await reportService.dao.updateStateOf('syncMode', true)
  } catch (err) {
    await logErrorAndSetProgress(reportService, err)
  }
}

module.exports.setReportService = (rService) => {
  reportService = rService
}
