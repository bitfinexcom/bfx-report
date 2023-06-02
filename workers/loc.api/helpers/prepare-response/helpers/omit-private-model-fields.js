'use strict'

const { omit } = require('lodash')

const OMITTING_FIELDS = [
  '_events',
  '_eventsCount',
  '_fields',
  '_boolFields',
  '_fieldKeys',
  '_apiInterface'
]

const _omitFields = (obj) => {
  const newObj = omit(obj, OMITTING_FIELDS)
  newObj._isDataFromApiV2 = true

  return newObj
}

module.exports = (res) => {
  if (
    Array.isArray(res) &&
    res.length > 0 &&
    res.every((item) => (item && typeof item === 'object'))
  ) {
    return res.map((item) => _omitFields(item))
  }
  if (
    res &&
    typeof res === 'object' &&
    Object.keys(res).length > 0
  ) {
    return _omitFields(res)
  }

  return res
}
