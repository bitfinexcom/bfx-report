'use strict'

const { getMethodLimit } = require('../../limit-param.helpers')

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
    apiRes.length === 0 ||
    methodLimit > limit ||
    apiRes.some((item) => (
      item?.[datePropName] !== mts
    ))
  )
}
