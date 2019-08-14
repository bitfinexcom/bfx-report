'use strict'

const { cloneDeep } = require('lodash')

const checkParams = require('./check-params')
const { getMethodLimit } = require('./limit-param.helpers')
const { getDateNotMoreNow } = require('./date-param.helpers')
const { MinLimitParamError } = require('../errors')

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
  orderTrades: [
    'symbol',
    'start',
    'end',
    'limit',
    'id'
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
  orderTrades: 'paramsSchemaForOrderTradesApi',
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

const _getSymbols = (
  methodApi,
  symbPropName,
  args
) => {
  if (
    typeof symbPropName !== 'string' ||
    !args.params ||
    typeof args.params !== 'object' ||
    !args.params.symbol
  ) {
    return null
  }

  const symbol = args.params.symbol

  if (
    methodApi === 'positionsHistory' ||
    methodApi === 'positionsAudit'
  ) {
    return Array.isArray(symbol)
      ? [...symbol]
      : [symbol]
  }

  return (
    Array.isArray(symbol) &&
    symbol.length > 1
  )
    ? [...symbol]
    : null
}

const _getSymbolParam = (
  methodApi,
  symbol,
  symbPropName
) => {
  if (
    typeof symbPropName === 'string' &&
    methodApi !== 'positionsHistory' &&
    methodApi !== 'positionsAudit' &&
    Array.isArray(symbol)
  ) {
    return symbol.length > 1 ? null : symbol[0]
  }

  if (
    !symbol &&
    methodApi === 'fundingTrades'
  ) {
    return null
  }

  return symbol
}

const _getParams = (
  args,
  methodApi,
  symbPropName
) => {
  if (
    !args.params ||
    typeof args.params !== 'object'
  ) {
    return {
      paramsArr: [],
      paramsObj: {}
    }
  }

  const paramsObj = {
    ...cloneDeep(args.params),
    end: getDateNotMoreNow(args.params.end),
    limit: getMethodLimit(args.params.limit, methodApi),
    symbol: _getSymbolParam(methodApi, args.params.symbol, symbPropName)
  }

  const paramsOrder = _getParamsOrder(methodApi)
  const paramsArr = paramsOrder.map(key => paramsObj[key])

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

const _requestToApi = (
  getREST,
  method,
  paramsArr,
  auth
) => {
  const rest = getREST(auth)

  return rest[_parseMethodApi(method)].bind(rest)(...paramsArr)
}

const _filterSymbs = (
  res,
  symbols,
  symbPropName
) => {
  if (
    typeof symbPropName !== 'string' ||
    !Array.isArray(res) ||
    !Array.isArray(symbols) ||
    symbols.length === 0
  ) {
    return res
  }

  return res.filter(item => {
    return symbols.some(s => s === item[symbPropName])
  })
}

const _isNotContainedSameMts = (
  apiRes,
  methodApi,
  datePropName,
  limit
) => {
  const firstElem = { ...apiRes[0] }
  const mts = firstElem[datePropName]

  return (
    methodApi !== 'movements' ||
    getMethodLimit('max', methodApi) !== limit ||
    apiRes.some((item) => {
      const _item = { ...item }
      const _mts = _item[datePropName]

      return _mts !== mts
    })
  )
}

const prepareResponse = (
  apiRes,
  datePropName,
  limit = 1000,
  notThrowError = false,
  notCheckNextPage = false,
  symbols,
  symbPropName,
  methodApi
) => {
  const isCheckedNextPage = (
    !notCheckNextPage &&
    Array.isArray(apiRes) &&
    apiRes.length === limit &&
    _isNotContainedSameMts(
      apiRes,
      methodApi,
      datePropName,
      limit
    )
  )
  const nextPage = isCheckedNextPage
    ? apiRes[apiRes.length - 1][datePropName]
    : false

  if (isCheckedNextPage) {
    while (
      apiRes[apiRes.length - 1] &&
      nextPage === apiRes[apiRes.length - 1][datePropName]
    ) {
      apiRes.pop()
    }

    if (!notThrowError && apiRes.length === 0) {
      throw new MinLimitParamError()
    }
  }

  const res = _filterSymbs(
    apiRes,
    symbols,
    symbPropName
  )

  return { res, nextPage }
}

const prepareApiResponse = (
  getREST
) => async (
  args,
  methodApi,
  datePropName,
  symbPropName,
  requireFields
) => {
  const schemaName = _getSchemaNameByMethodName(methodApi)

  checkParams(args, schemaName, requireFields)

  const symbols = _getSymbols(methodApi, symbPropName, args)
  const {
    paramsArr,
    paramsObj
  } = _getParams(args, methodApi, symbPropName)

  const res = await _requestToApi(
    getREST,
    methodApi,
    paramsArr,
    args.auth
  )

  return prepareResponse(
    res,
    datePropName,
    paramsObj.limit,
    args.params && args.params.notThrowError,
    args.params && args.params.notCheckNextPage,
    symbols,
    symbPropName,
    methodApi
  )
}

module.exports = {
  prepareResponse,
  prepareApiResponse
}
