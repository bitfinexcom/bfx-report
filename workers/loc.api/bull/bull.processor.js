'use strict'

const { promisify } = require('util')
const path = require('path')
const fs = require('fs')
const { stringify } = require('csv')

const access = promisify(fs.access)
const mkdir = promisify(fs.mkdir)
const readdir = promisify(fs.readdir) // TODO:

const tempDirPath = path.join(__dirname, 'temp')
const tempFilePath = path.join(tempDirPath, 'temporary-file.csv')

const streamPromise = stream => {
  return new Promise((resolve, reject) => {
    stream.on('end', () => {
      resolve('end')
    })
    stream.on('finish', () => {
      resolve('finish')
    })
    stream.on('error', error => {
      reject(error)
    })
  })
}

const _checkAndCreateDir = async () => {
  try {
    await access(tempDirPath, fs.F_OK)
    return Promise.resolve()
  } catch (err) {
    return mkdir(tempDirPath)
  }
}

const pushToFile = (data, writable, columns) => {
  stringify(data, {
    header: true,
    columns
  }).pipe(
    writable,
    { end: false }
  )
}

// TODO:
const _getFullData = async (
  reportService,
  { method, args, propName = 'mts', columns },
  stream
) => {
  if (typeof reportService[method] !== 'function') {
    throw new Error('ERR_METHOD_NOT_FOUND')
  }

  const getData = promisify(reportService[method])
  const res = await getData(null, args)

  if (!res || !Array.isArray(res) || res.length === 0) {
    return Promise.resolve(false)
  }

  let data = res[res.length - 1]

  pushToFile(res, stream, columns)

  if (
    typeof data === 'object' &&
    data[propName] &&
    Number.isInteger(data[propName])
  ) {
    args.params.end = data[propName] - 1

    await _getFullData(
      reportService,
      {
        method,
        args,
        propName,
        columns
      },
      stream
    )
  }

  return Promise.resolve(false)
}

// TODO:
module.exports = async (reportService, job) => {
  await _checkAndCreateDir()

  const writable = fs.createWriteStream(tempFilePath)
  const res = await _getFullData(reportService, job.data, writable)
  const writablePromise = streamPromise(writable)

  writable.end()

  await writablePromise

  return Promise.resolve(res)
}
