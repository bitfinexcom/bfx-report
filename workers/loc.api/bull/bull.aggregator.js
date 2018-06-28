'use strict'

const nodemailer = require('nodemailer')
const pug = require('pug')
const path = require('path')
const fs = require('fs')
const { promisify } = require('util')

const unlink = promisify(fs.unlink)

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

// TODO:
const _uploadS3 = (fileName) => {
  return Promise.resolve('https://www.bitfinex.com') // TODO: Change to real link
}

// TODO:
module.exports = async (job) => {
  try {
    const data = job.data
    console.log('---aggregator-data---', data) // TODO: Delete later

    const link = await _uploadS3(data.fileName)
    await _sendMail(data.email, { link })
    await unlink(data.fileName)

    return Promise.resolve()
  } catch (err) {
    console.error('---aggregator-error---', err.syscall) // TODO: Delete later

    if (err.syscall === 'unlink') {
      return Promise.resolve()
    }

    return Promise.reject(err)
  }
}

module.exports.setReportService = (rService) => {
  reportService = rService
}
