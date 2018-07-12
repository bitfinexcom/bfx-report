'use strict'

const pug = require('pug')
const path = require('path')
const fs = require('fs')
const { promisify } = require('util')

const unlink = promisify(fs.unlink)
const readFile = promisify(fs.readFile)

const emailView = path.join(__dirname, 'views/email.pug')

let reportService = null

const _sendMail = (to, data) => {
  const grcBfx = reportService.ctx.grc_bfx
  const configs = reportService.ctx.bull_aggregator.conf
  const text = pug.renderFile(emailView, data)
  const mailOptions = {
    to,
    text,
    ...configs.emailOpts
  }

  return new Promise((resolve, reject) => {
    grcBfx.req(
      'rest:ext:sendgrid',
      'sendEmail',
      [mailOptions],
      { timeout: 10000 },
      (err, data) => {
        if (err) {
          reject(err)

          return
        }

        resolve(data)
      }
    )
  })
}

const mapNames = new Map([
  ['getTrades', 'trades'],
  ['getLedgers', 'ledgers'],
  ['getOrders', 'orders'],
  ['getMovements', 'movements']
])

const _getFileName = queueName => {
  if (!mapNames.has(queueName)) {
    return queueName.replace(/^get/i, '').toLowerCase()
  }

  return mapNames.get(queueName)
}

const _uploadS3 = async (path, fileName) => {
  const grcBfx = reportService.ctx.grc_bfx
  const configs = reportService.ctx.bull_aggregator.conf.s3
  const buffer = await readFile(path)

  const opts = {
    ...configs,
    contentType: 'text/csv',
    contentDisposition: `${configs.contentDisposition || 'attachment'}; filename="${fileName}.csv"`
  }
  const parsedData = [
    buffer,
    opts
  ]

  return new Promise((resolve, reject) => {
    grcBfx.req(
      'rest:ext:s3',
      'uploadPresigned',
      parsedData,
      { timeout: 10000 },
      (err, data) => {
        if (err) {
          reject(err)

          return
        }

        resolve(data)
      }
    )
  })
}

module.exports = async (job) => {
  try {
    const data = job.data
    const fileName = _getFileName(job.name)

    const s3Data = await _uploadS3(data.fileName, fileName)
    const res = await _sendMail(data.email, { link: s3Data.public_url, fileName })
    await unlink(data.fileName)

    return Promise.resolve({ statusCode: res.statusCode })
  } catch (err) {
    if (err.syscall === 'unlink') {
      return Promise.resolve()
    }

    return Promise.reject(err)
  }
}

module.exports.setReportService = (rService) => {
  reportService = rService
}
