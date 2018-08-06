'use strict'

const { promisify } = require('util')
const fs = require('fs')

const unlink = promisify(fs.unlink)

const { uploadS3, sendMail } = require('./helpers')

let reportService = null

module.exports = async job => {
  const aggregatorQueue = reportService.ctx.lokue_aggregator.q

  try {
    const data = job.data

    const s3Data = await uploadS3(reportService, data.s3Conf, data.filePath, data.name)
    await sendMail(reportService, data.emailConf, data.email, 'email.pug', s3Data)
    await unlink(data.filePath)

    job.done()
    aggregatorQueue.emit('completed')
  } catch (err) {
    if (err.syscall === 'unlink') {
      job.done()
      aggregatorQueue.emit('error:unlink', job)
    }

    job.done(err)
    aggregatorQueue.emit('error:base', job)
  }
}

module.exports.setReportService = (rService) => {
  reportService = rService
}
