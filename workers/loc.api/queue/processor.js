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

    const isUnauth = job.data.isUnauth || false
    const write = isUnauth ? 'Your file could not be completed, please try again' : job
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
      write
    )

    stringifier.end()

    await writablePromise

    job.done()
    processorQueue.emit('completed', {
      userId: job.data.userId,
      name: job.data.name,
      filePath,
      email: job.data.args.params.email,
      endDate: job.data.args.params.end,
      startDate: job.data.args.params.start,
      isUnauth
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

    processorQueue.emit('error:base', err, job)
  }
}

module.exports.setReportService = (rService) => {
  reportService = rService
}
