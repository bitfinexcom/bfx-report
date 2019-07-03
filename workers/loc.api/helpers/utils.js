'use strict'

const { transform } = require('lodash')
const LRU = require('lru')

const { hasS3AndSendgrid } = require('../queue/helpers')
const {
  ObjectMappingError,
  EmailSendingError,
  AuthError
} = require('../errors')

const checkParamsAuth = (args) => {
  if (
    !args.auth ||
    typeof args.auth !== 'object' ||
    typeof args.auth.apiKey !== 'string' ||
    typeof args.auth.apiSecret !== 'string'
  ) {
    throw new AuthError()
  }
}

const getCsvStoreStatus = async (reportService, args) => {
  if (
    !args.params ||
    typeof args.params !== 'object' ||
    !args.params.email ||
    typeof args.params.email !== 'string'
  ) {
    return { isSaveLocaly: true }
  }

  if (!await hasS3AndSendgrid(reportService)) {
    throw new EmailSendingError()
  }

  return { isSendEmail: true }
}

const toString = (obj) => {
  try {
    const txt = JSON.stringify(obj)
    return txt
  } catch (e) {
    return obj && obj.toString()
  }
}

const parseFields = (res, opts) => {
  const { executed, rate } = opts

  return transform(res, (result, obj) => {
    if (executed) obj.amountExecuted = obj.amountOrig - obj.amount
    if (rate) obj.rate = obj.rate || 'Flash Return Rate'

    result.push(obj)
  }, [])
}

const accountCache = new LRU({ maxAge: 900000, max: 1 })

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

const mapObjBySchema = (obj, schema = {}) => {
  const err = new ObjectMappingError()

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

module.exports = {
  checkParamsAuth,
  getCsvStoreStatus,
  toString,
  parseFields,
  accountCache,
  refreshObj,
  tryParseJSON,
  mapObjBySchema,
  emptyRes
}
