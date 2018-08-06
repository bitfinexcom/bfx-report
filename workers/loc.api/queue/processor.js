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
  const processorQueue = reportService.ctx.lokue_processor.q

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

    job.done()
    processorQueue.emit('completed', {
      name: job.data.name,
      filePath,
      email: job.data.args.params.email
    })
  } catch (err) {
    try {
      await unlink(filePath)
    } catch (err) {
      processorQueue.emit('error:unlink', job)
    }

    job.done(err)

    if (isAuthError(err)) {
      processorQueue.emit('error:auth', job)
    }

    processorQueue.emit('error:base', job)
  }
}

module.exports.setReportService = (rService) => {
  reportService = rService
}
