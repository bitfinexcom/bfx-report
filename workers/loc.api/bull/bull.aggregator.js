'use strict'

const mime = require('mime-types')
const nodemailer = require('nodemailer')
const pug = require('pug')
const path = require('path')
const fs = require('fs')
const { promisify } = require('util')

const unlink = promisify(fs.unlink)
const readFile = promisify(fs.readFile)

const emailView = path.join(__dirname, 'views/email.pug')

let reportService = null

const _sendMail = (to, data) => {
  const configs = reportService.ctx.bull_aggregator.conf
  const transporter = nodemailer.createTransport(configs.emailTransport)
  const html = pug.renderFile(emailView, data)
  const mailOptions = {
    to,
    html,
    ...configs.emailOpts
  }

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        reject(err)
        return
      }

      resolve(info)
    })
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
  const mimeType = mime.lookup(path)
  const ext = mime.extension(mimeType)
  const buffer = await readFile(path)

  const opts = {
    ...configs,
    contentType: mimeType,
    contentDisposition: `${configs.contentDisposition || 'inline'}; filename="${fileName}.${ext}"`
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

// TODO:
module.exports = async (job) => {
  try {
    const data = job.data
    const fileName = _getFileName(job.name)

    const s3Data = await _uploadS3(data.fileName, fileName)
    await _sendMail(data.email, { link: s3Data.public_url })
    await unlink(data.fileName)

    return Promise.resolve()
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
