'use strict'

const {
  omit,
  cloneDeep
} = require('@bitfinex/lib-js-util-base')
const { createWriteStream } = require('node:fs')
const { unlink } = require('node:fs/promises')
const { stringify } = require('csv')

const {
  pipelineStreams
} = require('../helpers')
const {
  createUniqueFileName
} = require('./helpers')

const {
  isAuthError,
  getTranslator
} = require('../helpers')
const TRANSLATION_NAMESPACES = require(
  '../i18next/translation.namespaces'
)

const processReportFile = async (deps, args) => {
  const {
    data,
    filePath,
    streamSet,
    isUnauth
  } = args

  const language = data?.args?.params?.language
  const translate = getTranslator(
    { i18next: deps.i18next },
    {
      lng: language,
      ns: TRANSLATION_NAMESPACES.PDF
    }
  )
  const defaultUnauthMsg = 'Your file could not be completed, please try again'
  const unauthMsg = translate(defaultUnauthMsg, {
    prop: 'template.errorMessage'
  })
  const write = isUnauth
    ? unauthMsg
    : data

  const writable = createWriteStream(filePath)
  streamSet.add(writable)

  if (data?.args?.params?.isPDFRequired) {
    const pdfStream = await deps.pdfWriter
      .createPDFStream({
        jobData: data,
        pdfCustomTemplateName: data?.pdfCustomTemplateName,
        language,
        isError: isUnauth
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
  pdfWriter,
  i18next
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
            pdfWriter,
            i18next
          },
          {
            data,
            filePath,
            streamSet,
            isUnauth
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

      if (isAuthError(err)) {
        job.done()
        processorQueue.emit('error:auth', job)

        return
      }

      job.done(err)
      processorQueue.emit('error:base', err, job)
    } finally {
      for (const stream of streamSet) {
        stream.destroy()
        streamSet.delete(stream)
      }
    }
  }
}
