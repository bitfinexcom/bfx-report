'use strict'

const {
  omit,
  cloneDeep
} = require('lib-js-util-base')
const { promisify } = require('util')
const { pipeline } = require('stream')
const fs = require('fs')
const { stringify } = require('csv')

const unlink = promisify(fs.unlink)

const {
  createUniqueFileName,
  writableToPromise
} = require('./helpers')

const { isAuthError } = require('../helpers')

const processReportFile = async (deps, args) => {
  const {
    data,
    filePath
  } = args

  const write = data?.isUnauth
    ? 'Your file could not be completed, please try again'
    : data

  const writable = fs.createWriteStream(filePath)
  const writablePromise = writableToPromise(writable)

  if (data?.args?.params?.isPDFRequired) {
    const pdfStream = await deps.pdfWriter
      .createPDFStream(data?.pdfCustomTemplateName)

    pipeline(pdfStream, writable, () => {})

    await deps.writeDataToStream(
      pdfStream,
      write
    )

    pdfStream.end()

    return writablePromise
  }
  if (typeof data?.csvCustomWriter === 'function') {
    await data.csvCustomWriter(
      writable,
      write
    )

    return writablePromise
  }

  const stringifier = stringify({
    header: true,
    columns: data?.columnsCsv
  })

  pipeline(stringifier, writable, () => {})

  await deps.writeDataToStream(
    stringifier,
    write
  )

  stringifier.end()

  return writablePromise
}

module.exports = (
  conf,
  rootPath,
  processorQueue,
  aggregatorQueue,
  writeDataToStream,
  pdfWriter
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
          rootPath,
          data.args.params
        )
        filePaths.push(filePath)

        const {
          chunkCommonFolder,
          args: { params },
          name,
          fileNamesMap
        } = data ?? {}
        subParamsArr.push({
          ...omit(params, ['name', 'fileNamesMap']),
          name,
          fileNamesMap
        })
        chunkCommonFolders.push(chunkCommonFolder)

        await processReportFile(
          {
            writeDataToStream,
            pdfWriter
          },
          {
            data,
            filePath
          }
        )
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
