'use strict'

const { cloneDeep } = require('lodash')

const { getDateNotMoreNow } = require('../../date-param.helpers')
const { getMethodLimit } = require('../../limit-param.helpers')

const getParamsMap = require('./get-params-map')
const getSymbolParams = require('./get-symbol-params')

module.exports = (
  { args, apiMethodName, symbPropName },
  opts = {}
) => {
  if (
    !args.params ||
    typeof args.params !== 'object'
  ) {
    return {
      queryParams: {},
      allParams: {}
    }
  }

  const { params } = args ?? {}
  const { isInnerMax, isNotMoreThanInnerMax } = opts ?? {}
  const limit = isInnerMax
    ? { isInnerMax }
    : { limit: params.limit, isNotMoreThanInnerMax }
  const allParams = {
    ...cloneDeep(params),
    ...getSymbolParams({ apiMethodName, params, symbPropName }),
    end: getDateNotMoreNow(params.end),
    limit: getMethodLimit(limit, apiMethodName)
  }
  const paramsMap = getParamsMap(apiMethodName)
  const queryParams = Object.entries(paramsMap)
    .reduce((accum, [inParamName, queryParamNamesStr]) => {
      const queryParamNamesArr = queryParamNamesStr.split('.')
      const value = allParams[inParamName]

      queryParamNamesArr.reduce((innerAccum, propName, i, arr) => {
        const isLast = arr.length === (i + 1)

        innerAccum[propName] = isLast
          ? value
          : innerAccum[propName] ?? {}

        return innerAccum[propName]
      }, accum)

      return accum
    }, {})

  return {
    queryParams,
    allParams
  }
}
