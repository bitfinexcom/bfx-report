'use strict'

const {
  omit,
  cloneDeep
} = require('lib-js-util-base')
const { createWriteStream } = require('node:fs')
const { unlink } = require('node:fs/promises')
const { stringify } = require('csv')

const {
  pipelineStreams
} = require('../helpers')
const {
  createUniqueFileName
} = require('./helpers')

const { isAuthError } = require('../helpers')

const processReportFile = async (deps, args) => {
  const {
    data,
    filePath,
    streamSet
  } = args

  const write = data?.isUnauth
    ? 'Your file could not be completed, please try again'
    : data

  const writable = createWriteStream(filePath)
  streamSet.add(writable)

  if (data?.args?.params?.isPDFRequired) {
    const pdfStream = await deps.pdfWriter
      .createPDFStream({
        jobData: data,
        pdfCustomTemplateName: data?.pdfCustomTemplateName,
        language: data?.args?.params.language,
        isError: data?.isUnauth
      })
    streamSet.add(pdfStream)

    const pipelinePromise = pipelineStreams(pdfStream, writable)

    await deps.writeDataToStream(
      pdfStream,
      write
    )

    pdfStream.end()

    return await pipelinePromise
  }
  if (typeof data?.csvCustomWriter === 'function') {
    await data.csvCustomWriter(
      writable,
      write
    )

    return
  }

  const stringifier = stringify({
    header: true,
    columns: data?.columnsCsv
  })
  streamSet.add(stringifier)

  const pipelinePromise = pipelineStreams(stringifier, writable)

  await deps.writeDataToStream(
    stringifier,
    write
  )

  stringifier.end()

  return await pipelinePromise
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
    const streamSet = new Set()
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
            filePath,
            streamSet
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
    } finally {
      for (const stream of streamSet) {
        stream.destroy()
        streamSet.delete(stream)
      }
    }
  }
}
