'use strict'

const { cloneDeep } = require('lodash')

const getREST = require('./get-rest')
const checkParams = require('./check-params')
const { getMethodLimit } = require('./limit-param.helpers')
const { getDateNotMoreNow } = require('./date-param.helpers')

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

const _getParams = (
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
    paramsObj = cloneDeep(args.params)

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

const _parseMethodApi = name => {
  const refactor = {
    trades: 'accountTrades',
    publicTrades: 'trades',
    orders: 'orderHistory'
  }

  return refactor[name] || name
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
  } = _getParams(
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

module.exports = {
  prepareResponse,
  prepareApiResponse
}
