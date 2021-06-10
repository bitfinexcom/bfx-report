'use strict'

const {
  omit,
  cloneDeep
} = require('lodash')
const { promisify } = require('util')
const fs = require('fs')
const { stringify } = require('csv')

const unlink = promisify(fs.unlink)

const {
  createUniqueFileName,
  writableToPromise
} = require('./helpers')

const { isAuthError } = require('../helpers')

module.exports = (
  conf,
  rootPath,
  processorQueue,
  aggregatorQueue,
  writeDataToStream
) => {
  processorQueue.on('completed', (result) => {
    aggregatorQueue.addJob({
      ...result,
      emailConf: conf.emailConf,
      s3Conf: conf.s3Conf
    })
  })
  processorQueue.on('error:auth', (job) => {
    const data = cloneDeep(job.data)
    delete data.columnsCsv

    if (Array.isArray(data.jobsData)) {
      data.jobsData.forEach(item => {
        delete item.columnsCsv
      })
    }

    processorQueue.addJob({
      ...data,
      isUnauth: true
    })
  })

  return async (job) => {
    const filePaths = []
    const chunkCommonFolders = []
    const subParamsArr = []
    const isUnauth = job.data.isUnauth || false
    const jobsData = Array.isArray(job.data.jobsData)
      ? job.data.jobsData
      : [job.data]

    try {
      job.data.args.params = { ...job.data.args.params }

      const {
        userInfo,
        userId,
        name,
        args: {
          params: {
            email,
            isSignatureRequired,
            language
          }
        }
      } = { ...job.data }

      for (const data of jobsData) {
        data.args.params = { ...data.args.params }

        const filePath = await createUniqueFileName(
          rootPath
        )
        filePaths.push(filePath)

        const {
          chunkCommonFolder,
          args: { params },
          name,
          fileNamesMap,
          columnsCsv,
          csvCustomWriter
        } = { ...data }
        subParamsArr.push({
          ...omit(params, ['name', 'fileNamesMap']),
          name,
          fileNamesMap
        })
        chunkCommonFolders.push(chunkCommonFolder)

        const write = isUnauth
          ? 'Your file could not be completed, please try again'
          : data

        const writable = fs.createWriteStream(filePath)
        const writablePromise = writableToPromise(writable)

        if (typeof csvCustomWriter === 'function') {
          await csvCustomWriter(
            writable,
            write
          )
        } else {
          const stringifier = stringify({
            header: true,
            columns: columnsCsv
          })

          stringifier.pipe(writable)

          await writeDataToStream(
            stringifier,
            write
          )

          stringifier.end()
        }

        await writablePromise
      }

      job.done()
      processorQueue.emit('completed', {
        chunkCommonFolders,
        userInfo,
        userId,
        name,
        filePaths,
        subParamsArr,
        email,
        isSignatureRequired,
        language,
        isUnauth
      })
    } catch (err) {
      try {
        for (const filePath of filePaths) {
          await unlink(filePath)
        }
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
}
