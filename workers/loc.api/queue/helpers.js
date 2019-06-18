'use strict'

const { promisify } = require('util')
const path = require('path')
const fs = require('fs')
const uuidv4 = require('uuid/v4')
const _ = require('lodash')
const moment = require('moment-timezone')
const pug = require('pug')
const argv = require('yargs').argv
const yaml = require('js-yaml')

const access = promisify(fs.access)
const mkdir = promisify(fs.mkdir)
const readdir = promisify(fs.readdir)
const rename = promisify(fs.rename)
const chmod = promisify(fs.chmod)

const basePathToViews = path.join(__dirname, 'views')
const pathToTrans = path.join(__dirname, 'translations/email.yml')
const translations = yaml.safeLoad(fs.readFileSync(pathToTrans, 'utf8'))
const isElectronjsEnv = argv.isElectronjsEnv

const isRateLimitError = (err) => {
  return /(ERR(_RATE)?_LIMIT)|(ratelimit)/.test(err.toString())
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

const createUniqueFileName = async (rootPath, count = 0) => {
  count += 1

  if (count > 20) {
    throw new Error('ERR_CREATE_UNIQUE_FILE_NAME')
  }

  const tempDirPath = path.join(rootPath, 'workers/loc.api/queue', 'temp')

  await _checkAndCreateDir(tempDirPath)

  const uniqueFileName = `${uuidv4()}.csv`

  const files = await readdir(tempDirPath)

  if (files.some(file => file === uniqueFileName)) {
    return createUniqueFileName(rootPath, count)
  }

  return path.join(tempDirPath, uniqueFileName)
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
  } catch (e) {
    return moment(val).utcOffset(0).format(format)
  }
}

const _formatters = {
  date: (
    val,
    {
      timezone = 0,
      dateFormat = 'YY-MM-DD',
      milliseconds = false
    }
  ) => {
    if (Number.isInteger(val)) {
      const _ms = milliseconds ? '.SSS' : ''
      const format = `${dateFormat} HH:mm:ss${_ms}`
      return _.isNumber(timezone)
        ? moment(val).utcOffset(timezone).format(format)
        : _validTxtTimeZone(val, timezone, format)
    }

    return val
  },
  symbol: symbol => {
    if (
      symbol[0] !== 't' &&
      symbol[0] !== 'f'
    ) {
      return symbol
    }

    return `${symbol.slice(1, 4)}${symbol[4]
      ? '/' : ''}${symbol.slice(4, 7)}`
  },
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

const _normalizers = {
  getPublicTrades: (obj, params) => {
    if (
      params &&
      typeof params === 'object' &&
      typeof params.symbol === 'string'
    ) {
      obj.symbol = params.symbol
    }

    return obj
  }
}

const _dataNormalizer = (obj, method, params) => {
  if (
    typeof obj !== 'object' ||
    typeof _normalizers[method] !== 'function'
  ) {
    return obj
  }

  let res = _.cloneDeep(obj)

  try {
    res = _normalizers[method](res, params)
  } catch (err) {}

  return res
}

const write = (res, stream, formatSettings, params, method) => {
  res.forEach((item) => {
    const _item = _dataNormalizer(item, method, params)
    const res = _dataFormatter(_item, formatSettings, params)

    stream.write(res)
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

const getDataFromApi = async (getData, args) => {
  let countRateLimitError = 0
  let countNonceSmallError = 0
  let res = null

  while (true) {
    try {
      res = await getData(null, _.cloneDeep(args))

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

const _setDefaultPrams = (args) => {
  args.params.notThrowError = true
  args.params.end = args.params.end
    ? Math.min(args.params.end, Date.now())
    : Date.now()
  args.params.start = args.params.start
    ? args.params.start
    : 0
}

const writeDataToStream = async (reportService, stream, jobData) => {
  if (typeof jobData === 'string') {
    _writeMessageToStream(reportService, stream, jobData)

    return
  }

  const method = jobData.name

  if (typeof reportService[method] !== 'function') {
    throw new Error('ERR_METHOD_NOT_FOUND')
  }

  const queue = reportService.ctx.lokue_aggregator.q
  const propName = jobData.propNameForPagination
  const formatSettings = jobData.formatSettings

  const _args = _.cloneDeep(jobData.args)

  _setDefaultPrams(_args)
  const currIterationArgs = _.cloneDeep(_args)

  const getData = promisify(reportService[method].bind(reportService))

  let count = 0
  let serialRequestsCount = 0

  while (true) {
    queue.emit('progress', 0)

    const _res = await getDataFromApi(
      getData,
      currIterationArgs
    )

    const isGetWalletsMethod = method === 'getWallets'
    const isGetActivePositionsMethod = method === 'getActivePositions'
    let { res, nextPage } = (
      isGetWalletsMethod ||
      isGetActivePositionsMethod ||
      Object.keys({ ..._res }).every(key => key !== 'nextPage')
    )
      ? { res: _res, nextPage: null }
      : _res

    currIterationArgs.params.end = nextPage

    if (
      res &&
      Array.isArray(res) &&
      res.length === 0 &&
      nextPage &&
      Number.isInteger(nextPage) &&
      serialRequestsCount < 1
    ) {
      serialRequestsCount += 1

      continue
    }

    serialRequestsCount = 0

    if (
      !res ||
      !Array.isArray(res) ||
      res.length === 0
    ) {
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

    if (
      !lastItem ||
      typeof lastItem !== 'object'
    ) break

    const currTime = lastItem[propName]
    let isAllData = isGetWalletsMethod

    if (
      !isGetWalletsMethod &&
      !isGetActivePositionsMethod &&
      Number.isInteger(currTime) &&
      _args.params.start >= currTime
    ) {
      res = res.filter((item) => _args.params.start <= item[propName])
      isAllData = true
    }

    write(
      res,
      stream,
      formatSettings,
      { ..._args.params },
      method
    )

    count += res.length

    if (
      isAllData ||
      !Number.isInteger(currTime) ||
      !Number.isInteger(nextPage)
    ) {
      queue.emit('progress', 100)

      break
    }

    _progress(queue, currTime, _args.params)

    if (!Number.isInteger(currIterationArgs.params.end)) {
      currIterationArgs.params.end = lastItem[propName] - 1
    }
  }
}

const _writeMessageToStream = (reportService, stream, message) => {
  const queue = reportService.ctx.lokue_aggregator.q

  queue.emit('progress', 0)
  write([message], stream)
  queue.emit('progress', 100)
}

const _fileNamesMap = new Map([
  ['getTrades', 'trades'],
  ['getFundingTrades', 'funding_trades'],
  ['getPublicTrades', 'public_trades'],
  ['getPublicFunding', 'public_funding'],
  ['getLedgers', 'ledgers'],
  ['getOrders', 'orders'],
  ['getActiveOrders', 'active_orders'],
  ['getMovements', 'movements'],
  ['getFundingOfferHistory', 'funding_offers_history'],
  ['getFundingLoanHistory', 'funding_loans_history'],
  ['getFundingCreditHistory', 'funding_credits_history'],
  ['getPositionsHistory', 'positions_history'],
  ['getPositionsAudit', 'positions_audit'],
  ['getWallets', 'wallets'],
  ['getTickersHistory', 'tickers_history'],
  ['getActivePositions', 'active_positions']
])

const _getBaseName = (
  queueName,
  {
    isMultiExport,
    isDeposits,
    isWithdrawals,
    isTradingPair,
    fileNamesMap
  }
) => {
  const isValidFileNamesMap = (
    Array.isArray(fileNamesMap) &&
    fileNamesMap.every(item => (
      Array.isArray(item) &&
      typeof item[0] === 'string' &&
      typeof item[1] === 'string')
    )
  )
  const namesMap = new Map(
    [
      ..._fileNamesMap,
      ...(isValidFileNamesMap ? fileNamesMap : [])
    ]
  )

  if (
    queueName === 'getPublicTrades' &&
    !isTradingPair
  ) {
    return namesMap.get('getPublicFunding')
  }
  if (
    queueName === 'getMovements' &&
    (isDeposits || isWithdrawals)
  ) {
    return isDeposits
      ? 'deposits'
      : 'withdrawals'
  }
  if (isMultiExport) {
    return 'multiple-exports'
  }

  return namesMap.has(queueName)
    ? namesMap.get(queueName)
    : _.snakeCase(queueName.replace(/^get/, ''))
}

const _getCompleteFileName = (
  queueName,
  params,
  userInfo,
  ext = 'csv',
  isMultiExport
) => {
  const {
    start,
    end,
    isOnMomentInName
  } = params
  const baseName = _getBaseName(
    queueName,
    {
      ...params,
      isMultiExport
    }
  )

  const date = new Date()
  const formattedDateNow = _getDateString(date.getTime())
  const timestamp = date.toISOString().split(':').join('-')
  const startDate = start
    ? _getDateString(start)
    : _getDateString(0)
  const endDate = end
    ? _getDateString(end)
    : formattedDateNow
  const _ext = ext ? `.${ext}` : ''
  const _userInfo = userInfo ? `${userInfo}_` : ''
  const fileName = (
    queueName === 'getWallets' ||
    isMultiExport ||
    isOnMomentInName
  )
    ? `${_userInfo}${baseName}_MOMENT_${formattedDateNow}${_ext}`
    : `${_userInfo}${baseName}_FROM_${startDate}_TO_${endDate}_ON_${timestamp}${_ext}`

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
  rootPath,
  filePath,
  name,
  params,
  userInfo
) => {
  const localStorageDirPath = path.join(rootPath, argv.csvFolder || 'csv')

  await _checkAndCreateDir(localStorageDirPath)

  const fileName = _getCompleteFileName(name, params, userInfo)
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
  filePaths,
  queueName,
  subParamsArr,
  userInfo
) => {
  const grcBfx = reportService.ctx.grc_bfx
  const wrk = grcBfx.caller
  const isСompress = wrk.conf[wrk.group].isСompress
  const deflateFac = wrk.deflate_gzip
  const isMultiExport = (
    queueName === 'getMultiple' ||
    (Array.isArray(subParamsArr) && subParamsArr.length > 1)
  )
  const fileNameWithoutExt = _getCompleteFileName(
    subParamsArr[0].name,
    subParamsArr[0],
    userInfo,
    false,
    isMultiExport
  )

  const streams = filePaths.map((filePath, i) => {
    return {
      stream: fs.createReadStream(filePath),
      data: {
        name: _getCompleteFileName(
          subParamsArr[i].name,
          subParamsArr[i],
          userInfo
        )
      }
    }
  })
  const buffers = await Promise.all(deflateFac.createBuffZip(
    streams,
    isСompress,
    {
      comment: fileNameWithoutExt.replace(/_/g, ' ')
    }
  ))

  const promises = buffers.map((buffer, i) => {
    const fileName = isСompress && isMultiExport
      ? `${fileNameWithoutExt}.zip`
      : `${streams[i].data.name.slice(0, -3)}${isСompress ? 'zip' : 'csv'}`
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
  })

  return Promise.all(promises)
}

const _getTranslator = (
  language = 'en',
  trans = translations,
  isNotDefaultTranslatorUsed = false
) => {
  const translatorByDefault = (
    !isNotDefaultTranslatorUsed &&
    _getTranslator('en', trans, true)
  )

  return (defVal = '', opts) => {
    const prop = typeof opts === 'string'
      ? opts
      : ({ ...opts }).prop

    if (
      !trans ||
      typeof trans !== 'object' ||
      !trans[language] ||
      typeof trans[language] !== 'object' ||
      Object.keys(trans[language]) === 0 ||
      typeof prop !== 'string' ||
      !prop
    ) {
      return translatorByDefault
        ? translatorByDefault(defVal, prop)
        : defVal
    }

    const res = prop.split('.').reduce((accum, curr) => {
      if (
        typeof accum[curr] === 'object' ||
        typeof accum[curr] === 'string' ||
        Number.isFinite(accum[curr])
      ) {
        return accum[curr]
      }

      return accum
    }, trans[language])

    if (typeof res === 'object') {
      return translatorByDefault
        ? translatorByDefault(defVal, prop)
        : defVal
    }

    return res
  }
}

const sendMail = async (
  reportService,
  configs,
  to,
  viewName,
  dataArr
) => {
  const grcBfx = reportService.ctx.grc_bfx
  const pathToView = path.join(basePathToViews, viewName)

  const promises = dataArr.map(data => {
    const {
      presigned_url: url,
      language = 'en'
    } = { ...data }
    const translate = _getTranslator(language)
    const subject = translate(configs.subject, 'template.subject')
    const text = pug.renderFile(
      pathToView,
      {
        ...data,
        filters: { translate }
      }
    )
    const button = {
      url,
      text: translate('Download CSV', 'template.btnText')
    }
    const mailOptions = {
      ...configs,
      to,
      text,
      subject,
      button,
      language
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
  })

  return Promise.all(promises)
}

module.exports = {
  createUniqueFileName,
  writableToPromise,
  writeDataToStream,
  uploadS3,
  sendMail,
  moveFileToLocalStorage,
  hasS3AndSendgrid,
  write,
  getDataFromApi
}
