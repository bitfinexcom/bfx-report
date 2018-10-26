'use strict'

const { promisify } = require('util')
const _ = require('lodash')
const LRU = require('lru')
const Ajv = require('ajv')
const moment = require('moment-timezone')

const bfxFactory = require('./bfx.factory')
const { hasS3AndSendgrid } = require('./queue/helpers')

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

const getParams = (
  args,
  maxLimit,
  requireFields
) => {
  const params = []

  checkParams(
    args,
    requireFields,
    {
      type: 'object',
      properties: {
        limit: {
          type: 'integer'
        },
        start: {
          type: 'integer'
        },
        end: {
          type: 'integer'
        },
        symbol: {
          type: 'string'
        }
      }
    }
  )

  if (args.params) {
    params.push(
      ...[
        args.params.symbol,
        args.params.start,
        args.params.end,
        getLimitNotMoreThan(args.params.limit, maxLimit)
      ]
    )
  }

  return params
}

const _paramsSchema = {
  type: 'object',
  properties: {
    limit: {
      type: 'integer'
    },
    start: {
      type: 'integer'
    },
    end: {
      type: 'integer'
    },
    symbol: {
      type: 'string'
    },
    timezone: {
      type: ['number', 'string']
    },
    dateFormat: {
      type: 'string',
      enum: ['DD-MM-YY', 'MM-DD-YY', 'YY-MM-DD']
    }
  }
}

const checkParams = (
  args,
  requireFields = [],
  schema = _paramsSchema
) => {
  const ajv = new Ajv()
  const _schema = _.cloneDeep(schema)

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
  return /(apikey: digest invalid)|(apikey: invalid)|(ERR_AUTH_UNAUTHORIZED)/.test(err.toString())
}

const isEnotfoundError = (err) => {
  return /ENOTFOUND/.test(err.toString())
}

const isEaiAgainError = (err) => {
  return /EAI_AGAIN/.test(err.toString())
}

const isRateLimitError = (err) => {
  return /ERR_RATE_LIMIT/.test(err.toString())
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

module.exports = {
  getREST,
  getLimitNotMoreThan,
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
  refreshObj
}
