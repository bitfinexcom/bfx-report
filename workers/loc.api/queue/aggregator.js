'use strict'

const { promisify } = require('util')
const fs = require('fs')

const unlink = promisify(fs.unlink)

const {
  uploadS3,
  sendMail,
  hasS3AndSendgrid,
  moveFileToLocalStorage
} = require('./helpers')

let reportService = null

module.exports = async job => {
  const aggregatorQueue = reportService.ctx.lokue_aggregator.q
  const wReportServApi = reportService.ctx.grc_bfx.caller
  const conf = wReportServApi.conf[wReportServApi.group]

  try {
    const data = job.data
    const filePath = data.filePath
    const name = data.name
    const isUnauth = job.data.isUnauth || false
    const isEnableToSendEmail = typeof data.email === 'string' && await hasS3AndSendgrid(reportService)

    if (isEnableToSendEmail) {
      const s3Data = await uploadS3(reportService, data.s3Conf, filePath, name, data.startDate, data.endDate)
      s3Data.isUnauth = isUnauth
      await sendMail(reportService, data.emailConf, data.email, 'email.pug', s3Data)
      await unlink(data.filePath)
    } else {
      await moveFileToLocalStorage(filePath, name, data.startDate, data.endDate, conf.isElectronjsEnv)
    }

    job.done()
    aggregatorQueue.emit('completed')
  } catch (err) {
    if (err.syscall === 'unlink') {
      job.done()
      aggregatorQueue.emit('error:unlink', job)
    } else {
      try {
        await unlink(job.data.filePath)
      } catch (e) {

      }
      job.done(err)
    }

    aggregatorQueue.emit('error:base', err, job)
  }
}

module.exports.setReportService = (rService) => {
  reportService = rService
}
