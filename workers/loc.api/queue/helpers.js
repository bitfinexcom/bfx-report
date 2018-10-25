'use strict'

const { promisify } = require('util')
const path = require('path')
const fs = require('fs')
const uuidv4 = require('uuid/v4')
const _ = require('lodash')
const moment = require('moment-timezone')
const pug = require('pug')
const argv = require('yargs').argv

const access = promisify(fs.access)
const mkdir = promisify(fs.mkdir)
const readdir = promisify(fs.readdir)
const rename = promisify(fs.rename)
const chmod = promisify(fs.chmod)

const tempDirPath = path.join(__dirname, 'temp')
const rootDir = path.dirname(require.main.filename)
const localStorageDirPath = path.join(rootDir, argv.csvFolder || 'csv')
const basePathToViews = path.join(__dirname, 'views')
const isElectronjsEnv = argv.isElectronjsEnv

const isRateLimitError = (err) => {
  return /ERR_RATE_LIMIT/.test(err.toString())
}

const isNonceSmallError = (err) => {
  return /nonce: small/.test(err.toString())
}

const _checkAndCreateDir = async (dirPath) => {
  const basePath = path.join(dirPath, '..')

  try {
    await access(dirPath, fs.constants.F_OK | fs.constants.W_OK)
  } catch (err) {
    if (err.code === 'EACCES' && !isElectronjsEnv) throw err
    if (err.code === 'ENOENT') {
      try {
        await access(basePath, fs.constants.F_OK | fs.constants.W_OK)
      } catch (errBasePath) {
        if (errBasePath.code === 'EACCES' && isElectronjsEnv) {
          await chmod(basePath, '766')
        } else throw errBasePath
      }

      await mkdir(dirPath)
    }

    if (isElectronjsEnv) await chmod(dirPath, '766')
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

const _delay = (mc = 80000) => {
  return new Promise((resolve) => {
    setTimeout(resolve, mc)
  })
}
const _validTxtTimeZone = (val, timezone, format) => {
  try {
    return moment(val).tz(timezone).format(format)
  } catch (e) { // if txt timezone dont exists throws an error
    return moment(val).utcOffset(0).format(format)
  }
}
const _formatters = {
  date: (val, { timezone = 0, dateFormat = 'YY-MM-DD' }) => {
    if (Number.isInteger(val)) {
      const format = `${dateFormat} HH:mm:ss`
      return _.isNumber(timezone)
        ? moment(val).utcOffset(timezone).format(format)
        : _validTxtTimeZone(val, timezone, format)
    }

    return val
  },
  symbol: symbol => `${symbol.slice(1, 4)}${symbol[4]
    ? '/' : ''}${symbol.slice(4, 7)}`,
  side: side => {
    let msg

    if (side === 1) {
      msg = 'PROVIDED'
    } else if (side === 0) {
      msg = 'BOTH'
    } else if (side === -1) {
      msg = 'TAKEN'
    } else {
      msg = 'NULL'
    }

    return msg
  }
}

const _dataFormatter = (obj, formatSettings, params) => {
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
        typeof _formatters[val] === 'function'
      ) {
        res[key] = _formatters[val](obj[key], params)
      }
    } catch (err) {}
  })

  return res
}

const _write = (res, stream, formatSettings, method, params) => {
  res.forEach((item) => {
    const _item = _dataFormatter(item, formatSettings, params)

    stream.write(_item)
  })
}

const _progress = (queue, currTime, { start, end }) => {
  const percent = Math.round(((currTime - start) / (end - start)) * 100)

  queue.emit('progress', percent)
}

const _getDateString = mc => {
  return (new Date(mc)).toDateString().split(' ').join('-')
}

const _filterMovementsByAmount = (res, args) => {
  if (
    args.params.isDeposits ||
    args.params.isWithdrawals
  ) {
    const _res = res.filter((item) => {
      return args.params.isDeposits
        ? item.amount > 0
        : item.amount < 0
    })

    if (_res.length === 0) {
      return false
    }

    return _res
  }

  return res
}

const _getDataFromApi = async (getData, args) => {
  let countRateLimitError = 0
  let countNonceSmallError = 0
  let res = null

  while (true) {
    try {
      res = await getData(null, args)

      break
    } catch (err) {
      if (isRateLimitError(err)) {
        countRateLimitError += 1

        if (countRateLimitError > 1) {
          throw err
        }

        await _delay()

        continue
      } else if (isNonceSmallError(err)) {
        countNonceSmallError += 1

        if (countNonceSmallError > 20) {
          throw err
        }

        await _delay(1000)

        continue
      } else throw err
    }
  }

  return res
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

    res = await _getDataFromApi(getData, currIterationArgs)

    if (!res || !Array.isArray(res) || res.length === 0) {
      if (count > 0) queue.emit('progress', 100)

      break
    }

    if (method === 'getMovements') {
      res = _filterMovementsByAmount(res, _args)

      if (!res) {
        if (count > 0) queue.emit('progress', 100)

        break
      }
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

    _write(res, stream, formatSettings, method, { ..._args.params })

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
  ['getPublicTrades', 'public_trades'],
  ['getLedgers', 'ledgers'],
  ['getOrders', 'orders'],
  ['getMovements', 'movements'],
  ['getFundingOfferHistory', 'funding_offers_history'],
  ['getFundingLoanHistory', 'funding_loans_history'],
  ['getFundingCreditHistory', 'funding_credits_history']
])

const _getBaseName = queueName => {
  if (!_fileNamesMap.has(queueName)) {
    return queueName.replace(/^get/i, '').toLowerCase()
  }

  return _fileNamesMap.get(queueName)
}

const _getCompleteFileName = (
  queueName,
  start,
  end,
  ext = 'csv'
) => {
  const baseName = _getBaseName(queueName)
  const timestamp = (new Date()).toISOString().split(':').join('-')
  const startDate = start
    ? _getDateString(start)
    : _getDateString(0)
  const endDate = end
    ? _getDateString(end)
    : _getDateString((new Date()).getTime())
  const _ext = ext ? `.${ext}` : ''
  const fileName = `${baseName}_FROM_${startDate}_TO_${endDate}_ON_${timestamp}${_ext}`
  return fileName
}

const hasS3AndSendgrid = async reportService => {
  const lookUpFn = promisify(reportService.lookUpFunction
    .bind(reportService))

  const countS3Services = await lookUpFn(null, {
    params: { service: 'rest:ext:s3' }
  })
  const countSendgridServices = await lookUpFn(null, {
    params: { service: 'rest:ext:sendgrid' }
  })

  return !!(countS3Services && countSendgridServices)
}

const moveFileToLocalStorage = async (
  filePath,
  name,
  start,
  end
) => {
  await _checkAndCreateDir(localStorageDirPath)

  const fileName = _getCompleteFileName(name, start, end)
  const newFilePath = path.join(localStorageDirPath, fileName)

  try {
    await access(filePath, fs.constants.F_OK | fs.constants.W_OK)
  } catch (err) {
    if (err.code === 'EACCES' && isElectronjsEnv) {
      await chmod(filePath, '766')
    } else throw err
  }

  await rename(filePath, newFilePath)

  if (isElectronjsEnv) {
    await chmod(newFilePath, '766')
  }
}

const uploadS3 = async (
  reportService,
  configs,
  filePath,
  queueName,
  start,
  end
) => {
  const grcBfx = reportService.ctx.grc_bfx
  const wrk = grcBfx.caller
  const isСompress = wrk.conf[wrk.group].isСompress
  const deflateFac = wrk.deflate_gzip

  const fileNameWithoutExt = _getCompleteFileName(
    queueName,
    start,
    end,
    false
  )
  const fileName = `${fileNameWithoutExt}.${isСompress ? 'zip' : 'csv'}`

  const stream = fs.createReadStream(filePath)
  const buffer = await deflateFac.createBuffZip(
    [{
      stream,
      data: {
        name: `${fileNameWithoutExt}.csv`
      }
    }],
    isСompress,
    {
      comment: fileNameWithoutExt.replace(/_/g, ' ')
    }
  )[0]

  const opts = {
    ...configs,
    contentDisposition: `attachment; filename="${fileName}"`,
    contentType: isСompress ? 'application/zip' : 'text/csv'
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
  const html = pug.renderFile(
    path.join(basePathToViews, viewName),
    data
  )
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
  uploadS3,
  sendMail,
  moveFileToLocalStorage,
  hasS3AndSendgrid
}
