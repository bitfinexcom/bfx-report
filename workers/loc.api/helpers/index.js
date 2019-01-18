'use strict'

const { promisify } = require('util')
const _ = require('lodash')
const LRU = require('lru')
const Ajv = require('ajv')
const moment = require('moment-timezone')

const bfxFactory = require('./bfx.factory')
const schema = require('./schema')

const { hasS3AndSendgrid } = require('../queue/helpers')

const getMethodLimit = (sendLimit, method, methodsLimits = {}) => {
  const _methodsLimits = {
    tickersHistory: { default: 100, max: 250 },
    positionsHistory: { default: 25, max: 50 },
    positionsAudit: { default: 100, max: 250 },
    ledgers: { default: 250, max: 500 },
    trades: { default: 500, max: 1000 },
    publicTrades: { default: 500, max: 5000 },
    orders: { default: 250, max: 500 },
    movements: { default: 25, max: 25 },
    fundingOfferHistory: { default: 100, max: 500 },
    fundingLoanHistory: { default: 100, max: 500 },
    fundingCreditHistory: { default: 100, max: 500 },
    ...methodsLimits
  }

  const selectedMethod = _methodsLimits[method] || { default: 25, max: 25 }

  if (sendLimit === 'max') return selectedMethod.max

  const base = sendLimit || selectedMethod.default
  return getLimitNotMoreThan(base, selectedMethod.max)
}

function getCsvArgs (args, method) {
  const csvArgs = args
  csvArgs.params.limit = getMethodLimit('max', method)
  return csvArgs
}

const getREST = (auth, wrkReportServiceApi) => {
  if (typeof auth !== 'object') {
    throw new Error('ERR_AUTH_UNAUTHORIZED')
  }

  const group = wrkReportServiceApi.group
  const conf = wrkReportServiceApi.conf[group]

  const bfx = bfxFactory({ conf, ...auth })

  return bfx.rest(2, { transform: true })
}

const getLimitNotMoreThan = (limit, maxLimit = 25) => {
  const num = limit || maxLimit
  return Math.min(num, maxLimit)
}

const getDateNotMoreNow = (date, now = Date.now()) => {
  return getLimitNotMoreThan(date, now)
}

const _paramsOrderMap = {
  positionsHistory: [
    'start',
    'end',
    'limit'
  ],
  positionsAudit: [
    'id',
    'start',
    'end',
    'limit'
  ],
  default: [
    'symbol',
    'start',
    'end',
    'limit'
  ]
}

const _paramsSchemasMap = {
  publicTrades: 'paramsSchemaForPublicTrades',
  positionsAudit: 'paramsSchemaForPositionsAudit',
  default: 'paramsSchemaForApi'
}

const _getParamsOrder = (
  method,
  map = _paramsOrderMap
) => {
  return (
    map &&
    typeof map === 'object' &&
    map[method] &&
    Array.isArray(map[method])
  )
    ? map[method]
    : map.default
}

const _getSchemaNameByMethodName = (
  method,
  map = _paramsSchemasMap
) => {
  return (
    map &&
    typeof map === 'object' &&
    map[method] &&
    typeof map[method] === 'string'
  )
    ? map[method]
    : map.default
}

const getParams = (
  args,
  requireFields,
  methodApi,
  cb
) => {
  const paramsArr = []
  let paramsObj = {}

  checkParams(
    args,
    _getSchemaNameByMethodName(methodApi),
    requireFields
  )

  if (args.params) {
    const paramsOrder = _getParamsOrder(methodApi)
    paramsObj = _.cloneDeep(args.params)

    paramsObj.end = getDateNotMoreNow(args.params.end)
    paramsObj.limit = getMethodLimit(args.params.limit, methodApi)

    if (cb) cb(paramsObj)

    paramsArr.push(
      ...paramsOrder.map(key => paramsObj[key])
    )
  }

  return {
    paramsArr,
    paramsObj
  }
}

const checkParams = (
  args,
  schemaName = 'paramsSchemaForCsv',
  requireFields = [],
  additionalSchema = {}
) => {
  const ajv = new Ajv()
  const extendedSchema = { ...schema, ...additionalSchema }

  if (!extendedSchema[schemaName]) {
    throw new Error('ERR_PARAMS_SCHEMA_NOT_FOUND')
  }

  const _schema = _.cloneDeep(extendedSchema[schemaName])

  if (
    Array.isArray(requireFields) &&
    requireFields.length > 0
  ) {
    if (!args.params) {
      throw new Error('ERR_ARGS_NO_PARAMS')
    }

    if (!Array.isArray(_schema.required)) {
      _schema.required = []
    }

    requireFields.forEach(field => {
      _schema.required.push(field)
    })
  }

  if (
    args.params &&
    !ajv.validate(_schema, args.params)
  ) {
    throw new Error(`ERR_ARGS_NO_PARAMS ${JSON.stringify(ajv.errors)}`)
  }
}

const _setDefaultTimeIfNotExist = (args) => {
  args.params.end = getDateNotMoreNow(args.params.end)
  args.params.start = args.params.start
    ? args.params.start
    : 0
}

const checkTimeLimit = (args) => {
  _setDefaultTimeIfNotExist(args)

  const { start, end } = args.params
  const startDate = moment(start)
  const endDate = moment(end)

  if (start >= end || endDate.diff(startDate, 'months') > 1) {
    throw new Error('ERR_TIME_FRAME_MORE_THAN_MONTH')
  }
}

const checkParamsAuth = (args) => {
  if (
    !args.auth ||
    typeof args.auth !== 'object' ||
    typeof args.auth.apiKey !== 'string' ||
    typeof args.auth.apiSecret !== 'string'
  ) {
    throw new Error('ERR_AUTH_UNAUTHORIZED')
  }
}

const getCsvStoreStatus = async (reportService, args) => {
  if (!args.params || typeof args.params.email !== 'string') {
    return { isSaveLocaly: true }
  }

  if (!await hasS3AndSendgrid(reportService)) {
    throw new Error('ERR_CAN_NOT_SEND_EMAIL')
  }

  return { isSendEmail: true }
}

const hasJobInQueueWithStatusBy = async (
  reportService,
  args,
  statuses = ['ACTIVE', 'PROCESSING']
) => {
  const ctx = reportService.ctx
  const wrk = ctx.grc_bfx.caller
  const group = wrk.group
  const conf = wrk.conf[group]

  if (
    conf.syncMode ||
    !conf.isSpamRestrictionMode
  ) {
    await promisify(reportService.getEmail.bind(reportService))(null, args)

    return null
  }

  const userInfo = await reportService._getUserInfo(args)

  const procQ = ctx.lokue_processor.q
  const aggrQ = ctx.lokue_aggregator.q

  const hasJobInQueue = !(statuses.every(status => {
    return [procQ, aggrQ].every(queue => {
      const jobs = queue.listJobs(status)

      if (!Array.isArray(jobs)) {
        return true
      }

      return jobs.every(job => {
        return (
          typeof job === 'object' &&
          typeof job.data === 'object' &&
          typeof job.data.userId !== 'undefined' &&
          job.data.userId !== userInfo.id
        )
      })
    })
  }))

  if (hasJobInQueue) {
    throw new Error('ERR_HAS_JOB_IN_QUEUE')
  }

  return userInfo.id
}

const toString = (obj) => {
  try {
    const txt = JSON.stringify(obj)
    return txt
  } catch (e) {
    return obj && obj.toString()
  }
}

const isAuthError = (err) => {
  return /(missing api key or secret)|(apikey: digest invalid)|(apikey: invalid)|(ERR_AUTH_UNAUTHORIZED)/.test(err.toString())
}

const isEnotfoundError = (err) => {
  return /ENOTFOUND/.test(err.toString())
}

const isEaiAgainError = (err) => {
  return /EAI_AGAIN/.test(err.toString())
}

const isRateLimitError = (err) => {
  return /ERR(_RATE)?_LIMIT/.test(err.toString())
}

const isNonceSmallError = (err) => {
  return /nonce: small/.test(err.toString())
}

const parseFields = (res, opts) => {
  const { executed, rate } = opts
  return _.transform(res, (result, obj, key) => {
    if (executed) obj.amountExecuted = obj.amountOrig - obj.amount
    if (rate) obj.rate = obj.rate || 'Flash Return Rate'
    result.push(obj)
  }, [])
}

const accountCache = new LRU({maxAge: 900000, max: 1})

const _getTimezoneName = (name) => {
  let _name = name || 'UTC'
  const aliases = [
    ['Kiev', ['Kyiv']]
  ]

  aliases.some(item => {
    if (item[1].some(alias => alias === name)) {
      _name = item[0]

      return true
    }
  })

  const arr = _name.split(/[_-\s,./\\|]/g)
  const regExp = new RegExp(`${arr.join('.*')}`, 'gi')
  const zoneNames = moment.tz.names()

  for (const zone of zoneNames) {
    if (regExp.test(zone)) {
      return zone
    }
  }

  return 'UTC'
}

const _getTimezoneOffset = (timezoneName) => {
  const strTimezoneOffset = moment.tz(timezoneName).format('Z')
  const timezoneOffset = parseFloat(strTimezoneOffset)

  return isFinite(timezoneOffset)
    ? timezoneOffset
    : strTimezoneOffset
}

const getTimezoneConf = (name) => {
  const timezoneName = _getTimezoneName(name)
  const timezoneOffset = _getTimezoneOffset(timezoneName)
  return timezoneName
    ? {
      timezoneName,
      timezoneOffset
    }
    : {
      timezoneName: 'UTC',
      timezoneOffset: 0
    }
}

const refreshObj = (
  oldObj,
  newObj,
  currObj,
  props = []
) => {
  props.forEach(prop => {
    if (
      currObj[prop] &&
      oldObj[prop] !== currObj[prop]
    ) {
      newObj[prop] = currObj[prop]
    }
  })
}

const tryParseJSON = jsonString => {
  try {
    if (typeof jsonString !== 'string') {
      return false
    }

    const obj = JSON.parse(jsonString)

    if (obj && typeof obj === 'object') {
      return obj
    }
  } catch (e) { }

  return false
}

const prepareResponse = (
  res,
  datePropName,
  limit = 1000,
  notThrowError = false,
  notCheckNextPage = false,
  symbols,
  symbPropName
) => {
  let nextPage = (
    !notCheckNextPage &&
    Array.isArray(res) &&
    res.length === limit
  )

  if (nextPage) {
    const date = res[res.length - 1][datePropName]

    while (
      res[res.length - 1] &&
      date === res[res.length - 1][datePropName]
    ) {
      res.pop()
    }

    nextPage = date

    if (!notThrowError && res.length === 0) {
      throw new Error('ERR_GREATER_LIMIT_IS_NEEDED')
    }
  }

  if (
    symbols &&
    symbPropName &&
    typeof symbPropName === 'string' &&
    Array.isArray(symbols) &&
    symbols.length > 0
  ) {
    res = res.filter(item => {
      return symbols.some(s => s === item[symbPropName])
    })
  }

  return { res, nextPage }
}

const prepareApiResponse = async (
  args,
  wrk,
  methodApi,
  datePropName,
  symbPropName,
  requireFields
) => {
  const symbols = []
  const {
    paramsArr,
    paramsObj
  } = getParams(
    args,
    requireFields,
    methodApi,
    params => {
      if (
        symbPropName &&
        typeof symbPropName === 'string' &&
        params.symbol
      ) {
        if (
          methodApi === 'positionsHistory' ||
          methodApi === 'getPositionsAudit'
        ) {
          if (
            Array.isArray(params.symbol) &&
            params.symbol.length > 0
          ) {
            symbols.push(...params.symbol)
          } else {
            symbols.push(params.symbol)
          }
        } else if (Array.isArray(params.symbol)) {
          if (params.symbol.length > 1) {
            symbols.push(...params.symbol)
            params.symbol = null
          } else {
            params.symbol = params.symbol[0]
          }
        }
      }
    }
  )
  const rest = getREST(args.auth, wrk)

  let res = await rest[_parseMethodApi(methodApi)].bind(rest)(...paramsArr)

  return prepareResponse(
    res,
    datePropName,
    paramsObj.limit,
    args.params && args.params.notThrowError,
    args.params && args.params.notCheckNextPage,
    symbols,
    symbPropName
  )
}

function _parseMethodApi (name) {
  const refactor = {
    trades: 'accountTrades',
    publicTrades: 'trades',
    orders: 'orderHistory'
  }
  return refactor[name] || name
}

const mapObjBySchema = (obj, schema = {}) => {
  const err = new Error('ERR_MAPPING_AN_OBJECT_BY_THE_SCHEMA')

  if (
    !obj ||
    typeof obj !== 'object' ||
    !schema ||
    typeof schema !== 'object'
  ) {
    throw err
  }

  const map = Array.isArray(schema)
    ? schema.map(item => [item, null])
    : Object.entries(schema)

  return map.reduce((accum, [key, val]) => {
    const _val = val && typeof val === 'string' ? val : key

    if (
      !key ||
      typeof key !== 'string' ||
      typeof obj[_val] === 'undefined'
    ) {
      throw err
    }

    accum[key] = obj[_val]

    return accum
  }, {})
}

const emptyRes = (cb) => {
  const res = { res: [], nexPage: false }

  if (typeof cb === 'function') {
    cb(null, res)
  }

  return res
}

const logError = (logger, err, methodName, cb) => {
  const options = toString(err.options)
  const logTxtErr = `
  method: ${methodName}
  statusCode: ${err.statusCode}
  name: ${err.name}
  message: ${err.message}
  options: ${options}

  `
  logger.error(logTxtErr)

  if (cb) cb(err)
  else throw err
}

module.exports = {
  getREST,
  getLimitNotMoreThan,
  getDateNotMoreNow,
  getParams,
  checkParams,
  checkParamsAuth,
  getCsvStoreStatus,
  hasJobInQueueWithStatusBy,
  toString,
  isAuthError,
  isEnotfoundError,
  isEaiAgainError,
  isRateLimitError,
  isNonceSmallError,
  parseFields,
  accountCache,
  getTimezoneConf,
  refreshObj,
  tryParseJSON,
  checkTimeLimit,
  prepareResponse,
  prepareApiResponse,
  mapObjBySchema,
  emptyRes,
  getCsvArgs,
  logError,
  getMethodLimit
}
