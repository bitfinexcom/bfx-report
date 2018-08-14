'use strict'

const { promisify } = require('util')
const path = require('path')
const fs = require('fs')
const uuidv4 = require('uuid/v4')
const _ = require('lodash')
const moment = require('moment')
const pug = require('pug')
const argv = require('yargs').argv

const access = promisify(fs.access)
const mkdir = promisify(fs.mkdir)
const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const rename = promisify(fs.rename)
const chmod = promisify(fs.chmod)

const tempDirPath = path.join(__dirname, 'temp')
const rootDir = path.dirname(require.main.filename)
const localStorageDirPath = path.join(rootDir, argv.csvFolder || 'csv')
const basePathToViews = path.join(__dirname, 'views')

const _checkAndCreateDir = async (dirPath) => {
  const basePath = path.join(dirPath, '..')

  try {
    await access(dirPath, fs.constants.F_OK | fs.constants.W_OK)
  } catch (err) {
    if (err.code === 'ENOENT') {
      try {
        await access(basePath, fs.constants.F_OK | fs.constants.W_OK)
      } catch (errBasePath) {
        if (errBasePath.code === 'EACCES') await chmod(basePath, '766')

        throw errBasePath
      }

      await mkdir(dirPath)
    }

    await chmod(dirPath, '766')
  }
}

const createUniqueFileName = async (count = 0) => {
  count += 1

  if (count > 20) {
    return Promise.reject(new Error('ERR_CREATE_UNIQUE_FILE_NAME'))
  }

  await _checkAndCreateDir(tempDirPath)

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
    setTimeout(resolve, mc)
  })
}

const _formaters = {
  date: val => moment(val).format('DD/MM/YYYY, h:mm:ss A'),
  symbol: val => {
    const symbolsMap = [
      { tBTCUSD: 'BTC/USD' }
    ]

    let res = symbolsMap.find(item => item[val] !== 'undefined')
    res = typeof res === 'object' ? res[val] : val
    return res
  }
}

const _dataFormatter = (obj, formatSettings) => {
  if (
    typeof obj !== 'object' ||
    typeof formatSettings !== 'object'
  ) {
    return obj
  }

  const res = _.cloneDeep(obj)

  Object.entries(formatSettings).forEach(([key, val]) => {
    try {
      if (
        typeof obj[key] !== 'undefined' &&
        typeof _formaters[val] === 'function'
      ) {
        res[key] = _formaters[val](obj[key])
      }
    } catch (err) {}
  })

  return res
}

const _write = (res, stream, formatSettings) => {
  res.forEach((item) => {
    stream.write(_dataFormatter(item, formatSettings))
  })
}

const _progress = (queue, currTime, { start, end }) => {
  const percent = Math.round(((currTime - start) / (end - start)) * 100)

  queue.emit('progress', percent)
}

const _getDateString = mc => {
  return (new Date(mc)).toDateString().split(' ').join('-')
}

const writeDataToStream = async (reportService, stream, job) => {
  if (typeof job === 'string') {
    _writeMessageToStream(reportService, stream, job)

    return Promise.resolve()
  }

  const method = job.data.name

  if (typeof reportService[method] !== 'function') {
    throw new Error('ERR_METHOD_NOT_FOUND')
  }

  const queue = reportService.ctx.lokue_aggregator.q

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
    queue.emit('progress', 0)

    try {
      res = await getData(null, currIterationArgs)
    } catch (err) {
      if (_isRateLimitError(err)) {
        await _delay()
        res = await getData(null, currIterationArgs)
      } else throw err
    }

    if (!res || !Array.isArray(res) || res.length === 0) {
      if (count > 0) queue.emit('progress', 100)

      break
    }

    const lastItem = res[res.length - 1]
    const propName = job.data.propNameForPagination
    const formatSettings = job.data.formatSettings

    if (
      typeof lastItem !== 'object' ||
      !lastItem[propName] ||
      !Number.isInteger(lastItem[propName])
    ) break

    const currTime = lastItem[propName]
    let isAllData = false

    if (_args.params.start >= currTime) {
      res = res.filter((item) => _args.params.start <= item[propName])
      isAllData = true
    }

    if (_args.params.limit < (count + res.length)) {
      res.splice(_args.params.limit - count)
      isAllData = true
    }

    _write(res, stream, formatSettings)

    count += res.length
    const needElems = _args.params.limit - count

    if (isAllData || needElems <= 0) {
      queue.emit('progress', 100)

      break
    }

    _progress(queue, currTime, _args.params)

    currIterationArgs.params.end = lastItem[propName] - 1
    if (needElems) currIterationArgs.params.limit = needElems
  }

  return Promise.resolve()
}

const _writeMessageToStream = (reportService, stream, message) => {
  const queue = reportService.ctx.lokue_aggregator.q

  queue.emit('progress', 0)
  _write([message], stream)
  queue.emit('progress', 100)
}

const _fileNamesMap = new Map([
  ['getTrades', 'trades'],
  ['getLedgers', 'ledgers'],
  ['getOrders', 'orders'],
  ['getMovements', 'movements']
])

const _getBaseName = queueName => {
  if (!_fileNamesMap.has(queueName)) {
    return queueName.replace(/^get/i, '').toLowerCase()
  }

  return _fileNamesMap.get(queueName)
}

const _getCompleteFileName = (queueName, start, end) => {
  const baseName = _getBaseName(queueName)
  const timestamp = (new Date()).toISOString().split(':').join('-')
  const startDate = start ? _getDateString(start) : _getDateString(0)
  const endDate = end ? _getDateString(end) : _getDateString((new Date()).getTime())
  const fileName = `${baseName}_FROM_${startDate}_TO_${endDate}_ON_${timestamp}.csv`
  return fileName
}

const checkS3SendgridCoreUser = async reportService => {
  const lookUpFn = promisify(reportService.lookUpFunction.bind(reportService))

  const countS3Services = await lookUpFn(null, {
    params: { service: 'rest:ext:s3' }
  })
  if (!countS3Services) throw new Error('REPORT_S3_WAS_NOT_FOUNDED')

  const countSendgridServices = await lookUpFn(null, {
    params: { service: 'rest:ext:sendgrid' }
  })
  if (!countSendgridServices) throw new Error('REPORT_SENDGRID_WAS_NOT_FOUNDED')

  const countCoreUserServices = await lookUpFn(null, {
    params: { service: 'rest:core:user' }
  })
  if (!countCoreUserServices) throw new Error('REPORT_CORE_USER_WAS_NOT_FOUNDED')
}

const moveFileToLocalStorage = async (filePath, name, start, end) => {
  await _checkAndCreateDir(localStorageDirPath)

  const fileName = _getCompleteFileName(name, start, end)
  const newFilePath = path.join(localStorageDirPath, fileName)

  try {
    await access(filePath, fs.constants.F_OK | fs.constants.W_OK)
  } catch (err) {
    if (err.code === 'EACCES') {
      await chmod(filePath, '766')
    }

    throw err
  }

  await rename(filePath, newFilePath)
  await chmod(newFilePath, '766')
}

const getEmail = async (reportService, args) => {
  const grcBfx = reportService.ctx.grc_bfx

  return new Promise(async (resolve, reject) => {
    grcBfx.req(
      'rest:core:user',
      'checkAuthToken',
      args.token,
      { timeout: 10000 },
      (err, data) => {
        if (err) return reject(err)
        if (data.email) return resolve(data.email)
        else return reject(new Error('No email found'))
      })
  })
}

const uploadS3 = async (reportService, configs, filePath, queueName, start, end) => {
  const grcBfx = reportService.ctx.grc_bfx
  const buffer = await readFile(filePath)
  const fileName = _getCompleteFileName(queueName, start, end)

  const opts = {
    ...configs,
    contentDisposition: `attachment; filename="${fileName}"`,
    contentType: 'text/csv'
  }
  const parsedData = [
    buffer.toString('hex'),
    opts
  ]

  return new Promise((resolve, reject) => {
    grcBfx.req(
      'rest:ext:s3',
      'uploadPresigned',
      parsedData,
      { timeout: 10000 },
      (err, data) => {
        if (err) {
          reject(err)

          return
        }

        resolve({
          ...data,
          fileName
        })
      }
    )
  })
}

const sendMail = (reportService, configs, to, viewName, data) => {
  const grcBfx = reportService.ctx.grc_bfx
  const text = `Download (${data.fileName}): ${data.public_url}`
  const html = pug.renderFile(path.join(basePathToViews, viewName), data)
  const mailOptions = {
    to,
    text,
    html,
    ...configs
  }

  return new Promise((resolve, reject) => {
    grcBfx.req(
      'rest:ext:sendgrid',
      'sendEmail',
      [mailOptions],
      { timeout: 10000 },
      (err, data) => {
        if (err) {
          reject(err)

          return
        }

        resolve(data)
      }
    )
  })
}

module.exports = {
  createUniqueFileName,
  writableToPromise,
  writeDataToStream,
  isAuthError,
  uploadS3,
  sendMail,
  checkS3SendgridCoreUser,
  moveFileToLocalStorage,
  getEmail
}
