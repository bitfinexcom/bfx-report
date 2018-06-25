'use strict'

const { promisify } = require('util')
const path = require('path')
const fs = require('fs')
const { stringify } = require('csv')
const uuidv1 = require('uuid/v1')

const access = promisify(fs.access)
const mkdir = promisify(fs.mkdir)
const readdir = promisify(fs.readdir)
const rename = promisify(fs.rename)

const tempDirPath = path.join(__dirname, 'temp')
const tempFilePath = path.join(tempDirPath, 'temporary-file.csv')

const _writableToPromise = stream => {
  return new Promise((resolve, reject) => {
    stream.once('finish', () => {
      resolve('finish')
    })
    stream.once('error', error => {
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

const _createUniqueFileName = async (count = 0) => {
  count += 1

  if (count > 20) {
    return Promise.reject(new Error('ERR_CREATE_UNIQUE_FILE_NAME'))
  }

  const uFileName = `${uuidv1()}.csv`

  const files = await readdir(tempDirPath)

  if (files.some(file => file === uFileName)) {
    return _createUniqueFileName(count)
  }

  return Promise.resolve(path.join(tempDirPath, uFileName))
}

const _isRateLimit = (err) => {
  return /ERR_RATE_LIMIT/.test(err.toString())
}

// TODO:
const _getFullData = async (
  reportService,
  { method, args, propName = 'mts' },
  stream,
  { resolve, reject }
) => {
  if (typeof reportService[method] !== 'function') {
    reject(new Error('ERR_METHOD_NOT_FOUND'))
    return
  }

  const getData = promisify(reportService[method])
  let res = null
  let promiseInterval = Promise.resolve()

  try {
    res = await getData(null, args)
  } catch (err) {
    if (!_isRateLimit(err)) {
      reject(err)
      return
    }

    promiseInterval = new Promise((resolve, reject) => {
      setInterval(async () => {
        res = await getData(null, args)
        resolve()
      }, 80000)
    })
  }

  await promiseInterval

  if (!res || !Array.isArray(res) || res.length === 0) {
    resolve()
    return
  }

  let data = res[res.length - 1]

  res.forEach((item) => {
    stream.write(item)
  })

  if (
    typeof data === 'object' &&
    data[propName] &&
    Number.isInteger(data[propName])
  ) {
    args.params.end = data[propName] - 1

    await new Promise((resolve, reject) => {
      setImmediate(() => {
        _getFullData(
          reportService,
          {
            method,
            args,
            propName
          },
          stream,
          { resolve, reject }
        )
      })
    })
  }

  resolve()
}

// TODO:
module.exports = async (reportService, job) => {
  try {
    await _checkAndCreateDir()

    const writable = fs.createWriteStream(tempFilePath)
    const writablePromise = _writableToPromise(writable)
    const stringifier = stringify({
      header: true,
      columns: job.data.columns
    })

    stringifier.pipe(writable)

    await new Promise((resolve, reject) => {
      _getFullData(
        reportService,
        job.data,
        stringifier,
        { resolve, reject }
      )
    })

    stringifier.end()

    await writablePromise

    const niqueFileName = await _createUniqueFileName()
    await rename(tempFilePath, niqueFileName)

    return Promise.resolve(niqueFileName)
  } catch (err) {
    return Promise.reject(err)
  }
}
