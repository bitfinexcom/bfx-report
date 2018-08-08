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

  try {
    const data = job.data
    const filePath = data.filePath
    const name = data.name
    const isUnauth = job.data.isUnauth || false
    const isEnableS3AndSendgrid = await hasS3AndSendgrid(reportService)

    if (isEnableS3AndSendgrid) {
      const s3Data = await uploadS3(reportService, data.s3Conf, filePath, name)
      s3Data.isUnauth = isUnauth
      await sendMail(reportService, data.emailConf, data.email, 'email.pug', s3Data)
      await unlink(data.filePath)
    } else {
      await moveFileToLocalStorage(filePath, name, data.startDate, data.endDate)
    }

    job.done()
    aggregatorQueue.emit('completed')
  } catch (err) {
    if (err.syscall === 'unlink') {
      job.done()
      aggregatorQueue.emit('error:unlink', job)
    } else job.done(err)

    aggregatorQueue.emit('error:base', err, job)
  }
}

module.exports.setReportService = (rService) => {
  reportService = rService
}
