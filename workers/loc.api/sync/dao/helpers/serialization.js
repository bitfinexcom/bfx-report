'use strict'

const {
  tryParseJSON
} = require('../../../helpers')

const serializeVal = (val) => {
  if (typeof val === 'boolean') {
    return +val
  } else if (typeof val === 'object') {
    return JSON.stringify(val)
  }

  return val
}

const deserializeVal = (
  val,
  key,
  boolFields = [
    'notify',
    'hidden',
    'renew',
    'noClose',
    'maker',
    '_isMarginFundingPayment'
  ]
) => {
  if (
    typeof val === 'string' &&
    /^null$/.test(val)
  ) {
    return null
  } else if (
    typeof val === 'number' &&
    boolFields.some(item => item === key)
  ) {
    return !!val
  } else if (
    typeof val === 'string' &&
    key === 'rate'
  ) {
    const _val = parseFloat(val)

    return isFinite(_val) ? _val : val
  } else if (tryParseJSON(val)) {
    return tryParseJSON(val)
  }

  return val
}

module.exports = {
  serializeVal,
  deserializeVal
}
