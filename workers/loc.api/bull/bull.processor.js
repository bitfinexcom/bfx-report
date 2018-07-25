'use strict'

const { promisify } = require('util')
const fs = require('fs')
const { stringify } = require('csv')
const unlink = promisify(fs.unlink)

const {
  createUniqueFileName,
  writableToPromise,
  writeDataToStream,
  isAuthError
} = require('./helpers')

let reportService = null

module.exports = async job => {
  let filePath = null

  try {
    filePath = await createUniqueFileName()

    const writable = fs.createWriteStream(filePath)
    const writablePromise = writableToPromise(writable)
    const stringifier = stringify({
      header: true,
      columns: job.data.columnsCsv
    })

    stringifier.pipe(writable)
    await writeDataToStream(
      reportService,
      stringifier,
      job,
      filePath
    )
    stringifier.end()

    await writablePromise

    return Promise.resolve({
      filePath
    })
  } catch (err) {
    if (isAuthError(err)) {
      await unlink(filePath)
      await job.discard()
    }

    return Promise.reject(err)
  }
}

module.exports.setReportService = (rService) => {
  reportService = rService
}
