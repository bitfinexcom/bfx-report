'use strict'

const { getMethodLimit } = require('../../limit-param.helpers')

const checkLength = (apiRes, apiMethodName) => {
  if (apiMethodName === 'candles') {
    return apiRes.length <= 1
  }

  return apiRes.length === 0
}

module.exports = (args, opts) => {
  const {
    apiRes,
    apiMethodName,
    datePropName,
    limit
  } = args ?? {}
  const {
    isMax = true,
    isInnerMax,
    isNotMoreThanInnerMax
  } = opts ?? {}

  if (!Array.isArray(apiRes)) {
    return false
  }

  const firstElem = apiRes[0] ?? {}
  const mts = firstElem?.[datePropName]
  const methodLimit = getMethodLimit(
    { isMax, isInnerMax, isNotMoreThanInnerMax },
    apiMethodName
  )

  return (
    checkLength(apiRes, apiMethodName) || // Check makes sense to prevent double requests to api
    methodLimit > limit ||
    apiRes.some((item) => (
      item?.[datePropName] !== mts
    ))
  )
}
