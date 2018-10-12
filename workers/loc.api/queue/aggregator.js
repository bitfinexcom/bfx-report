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
    const {
      name,
      filePath,
      email,
      endDate,
      startDate,
      isUnauth,
      s3Conf,
      emailConf
    } = job.data

    const isEnableToSendEmail = (
      typeof email === 'string' &&
      await hasS3AndSendgrid(reportService)
    )

    if (isEnableToSendEmail) {
      const s3Data = await uploadS3(
        reportService,
        s3Conf,
        filePath,
        name,
        startDate,
        endDate
      )
      s3Data.isUnauth = isUnauth

      await sendMail(
        reportService,
        emailConf,
        email,
        'email.pug',
        s3Data
      )
      await unlink(filePath)
    } else {
      await moveFileToLocalStorage(
        filePath,
        name,
        startDate,
        endDate
      )
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
