'use strict'

const { omit } = require('lib-js-util-base')

const OMITTING_FIELDS = [
  '_events',
  '_eventsCount',
  '_fields',
  '_boolFields',
  '_fieldKeys',
  '_apiInterface',
  'emptyFill'
]

const _omitFields = (obj, opts) => {
  const newObj = omit(obj, OMITTING_FIELDS)

  if (!opts?.isNotDataFromApiV2) {
    newObj._isDataFromApiV2 = true
  }

  return newObj
}

module.exports = (res, opts) => {
  if (
    Array.isArray(res) &&
    res.length > 0 &&
    res.every((item) => (item && typeof item === 'object'))
  ) {
    return res.map((item) => _omitFields(item, opts))
  }
  if (
    res &&
    typeof res === 'object' &&
    Object.keys(res).length > 0
  ) {
    return _omitFields(res, opts)
  }

  return res
}
