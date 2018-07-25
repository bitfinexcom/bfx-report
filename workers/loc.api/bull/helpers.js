'use strict'

const { promisify } = require('util')
const path = require('path')
const fs = require('fs')
const uuidv4 = require('uuid/v4')
const _ = require('lodash')

const access = promisify(fs.access)
const mkdir = promisify(fs.mkdir)
const readdir = promisify(fs.readdir)

const tempDirPath = path.join(__dirname, 'temp')

const _checkAndCreateDir = async () => {
  try {
    await access(tempDirPath, fs.F_OK)
    return Promise.resolve()
  } catch (err) {
    return mkdir(tempDirPath)
  }
}

const createUniqueFileName = async (count = 0) => {
  count += 1

  if (count > 20) {
    return Promise.reject(new Error('ERR_CREATE_UNIQUE_FILE_NAME'))
  }

  await _checkAndCreateDir()

  const uniqueFileName = `${uuidv4()}.csv`

  const files = await readdir(tempDirPath)

  if (files.some(file => file === uniqueFileName)) {
    return createUniqueFileName(count)
  }

  return Promise.resolve(path.join(tempDirPath, uniqueFileName))
}

const writableToPromise = stream => {
  return new Promise((resolve, reject) => {
    stream.once('finish', () => {
      resolve('finish')
    })
    stream.once('error', err => {
      reject(err)
    })
  })
}

const _isRateLimitError = (err) => {
  return /ERR_RATE_LIMIT/.test(err.toString())
}

const isAuthError = (err) => {
  return /apikey: digest invalid/.test(err.toString())
}

const _delay = (mc = 80000) => {
  return new Promise((resolve) => {
    setInterval(resolve, mc)
  })
}

const _write = (res, stream) => {
  res.forEach((item) => {
    stream.write(item)
  })
}

const _progress = (job, currTime, { start, end }) => {
  // TODO:
  const percent = 100

  return job.progress(percent)
}

const writeDataToStream = async (reportService, stream, job) => {
  const method = job.name

  if (typeof reportService[method] !== 'function') {
    throw new Error('ERR_METHOD_NOT_FOUND')
  }

  const _args = _.cloneDeep(job.data.args)
  _args.params.end = _args.params.end
    ? _args.params.end
    : (new Date()).getTime()
  _args.params.start = _args.params.start
    ? _args.params.start
    : 0

  const currIterationArgs = _.cloneDeep(_args)

  const getData = promisify(reportService[method].bind(reportService))

  let res = null
  let count = 0

  while (true) {
    await job.progress(0)

    try {
      res = await getData(null, currIterationArgs)
    } catch (err) {
      if (_isRateLimitError(err)) {
        await _delay()
        res = await getData(null, currIterationArgs)
      }

      throw err
    }

    if (!res || !Array.isArray(res) || res.length === 0) break

    const lastItem = res[res.length - 1]
    const propName = job.data.propNameForPagination

    if (
      typeof lastItem !== 'object' ||
      !lastItem[propName] ||
      !Number.isInteger(lastItem[propName])
    ) break

    const currTime = lastItem[propName]

    if (_args.params.start >= currTime) {
      res = res.filter((item) => _args.params.start <= item[propName])
      _write(res, stream)
      await _progress(job, currTime, _args.params)

      break
    }

    if (_args.params.limit < (count + res.length)) {
      const deleteElems = res.length - (count + res.length - _args.params.limit)
      res.splice(deleteElems)
      _write(res, stream)
      await _progress(job, currTime, _args.params)

      break
    }

    _write(res, stream)
    await _progress(job, currTime, _args.params)

    count += res.length
    currIterationArgs.params.end = lastItem[propName] - 1
    currIterationArgs.params.limit = _args.params.limit - count
  }

  return Promise.resolve()
}

module.exports = {
  createUniqueFileName,
  writableToPromise,
  writeDataToStream,
  isAuthError
}
