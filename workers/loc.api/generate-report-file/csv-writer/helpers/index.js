'use strict'

const { stringify } = require('csv')

const {
  pipelineStreams
} = require('../../../helpers')

const streamWriterToOne = async (
  rStream,
  wStream,
  writeFn,
  opts
) => {
  const { end = true } = opts ?? {}
  const promise = pipelineStreams(rStream, wStream, { end })

  writeFn(rStream)
  rStream.end()

  await promise
}

const streamWriter = async (wStream, csvStreamDataMap) => {
  for (const [i, csvStreamData] of csvStreamDataMap.entries()) {
    const isLast = (i + 1) === csvStreamDataMap.length
    const {
      columnParams,
      writeFn
    } = csvStreamData

    const stringifier = stringify(columnParams)
    await streamWriterToOne(
      stringifier,
      wStream,
      writeFn,
      { end: isLast }
    )
  }
}

module.exports = {
  streamWriterToOne,
  streamWriter
}
