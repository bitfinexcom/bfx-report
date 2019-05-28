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
      userInfo,
      name,
      filePaths,
      subParamsArr,
      email,
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
        filePaths,
        name,
        subParamsArr,
        {
          ...userInfo,
          email
        }
      )

      await sendMail(
        reportService,
        emailConf,
        email,
        'email.pug',
        s3Data.map((item, i) => ({
          ...item,
          isUnauth,
          language: subParamsArr[i].language
        }))
      )

      for (const filePath of filePaths) {
        await unlink(filePath)
      }
    } else {
      let count = 0

      for (const filePath of filePaths) {
        await moveFileToLocalStorage(
          reportService.ctx.rootPath,
          filePath,
          subParamsArr[count].name || name,
          { ...subParamsArr[count] },
          userInfo.username
        )

        count += 1
      }
    }

    job.done()
    aggregatorQueue.emit('completed')
  } catch (err) {
    if (err.syscall === 'unlink') {
      aggregatorQueue.emit('error:unlink', job)
      job.done()
    } else {
      try {
        for (const filePath of job.data.filePaths) {
          await unlink(filePath)
        }
      } catch (e) {
        aggregatorQueue.emit('error:unlink', job)
      }

      job.done(err)
    }

    aggregatorQueue.emit('error:base', err, job)
  }
}

module.exports.setReportService = (rService) => {
  reportService = rService
}
