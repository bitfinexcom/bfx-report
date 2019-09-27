'use strict'

const {
  cloneDeep,
  isEmpty,
  omit
} = require('lodash')

const filterResponse = require('./filter-response')
const checkParams = require('./check-params')
const checkFilterParams = require('./check-filter-params')
const { getMethodLimit } = require('./limit-param.helpers')
const { getDateNotMoreNow } = require('./date-param.helpers')
const { MinLimitParamError } = require('../errors')

const _paramsOrderMap = {
  statusMessages: [
    'type',
    'symbol'
  ],
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
  statusMessages: 'paramsSchemaForStatusMessagesApi',
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
    !args.params.symbol ||
    methodApi === 'statusMessages'
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
    methodApi === 'statusMessages'
  ) {
    const _symbol = isEmpty(symbol)
      ? 'ALL'
      : symbol

    return Array.isArray(_symbol)
      ? _symbol
      : [_symbol]
  }
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

const _isNotContainedSameMts = (
  apiRes,
  methodApi,
  datePropName,
  limit
) => {
  const firstElem = { ...apiRes[0] }
  const mts = firstElem[datePropName]

  return (
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
  methodApi,
  filter
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

  const filteredResBySymb = (
    Array.isArray(symbols) &&
    symbols.length > 0
  )
    ? filterResponse(
      apiRes,
      { $in: { [symbPropName]: symbols } }
    )
    : apiRes
  const res = filterResponse(
    filteredResBySymb,
    { ...filter }
  )

  return { res, nextPage }
}

const _omitPrivateModelFields = (res) => {
  const omittingFields = [
    '_events',
    '_eventsCount',
    '_fields',
    '_boolFields',
    '_fieldKeys'
  ]

  if (
    Array.isArray(res) &&
    res.length > 0 &&
    res.every((item) => (item && typeof item === 'object'))
  ) {
    return res.map((item) => {
      return {
        _isDataFromApiV2: true,
        ...omit(item, omittingFields)
      }
    })
  }
  if (
    res &&
    typeof res === 'object' &&
    Object.keys(res).length > 0
  ) {
    return {
      _isDataFromApiV2: true,
      ...omit(res, omittingFields)
    }
  }

  return res
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
  checkFilterParams(methodApi, args)

  const symbols = _getSymbols(methodApi, symbPropName, args)
  const {
    paramsArr,
    paramsObj
  } = _getParams(args, methodApi, symbPropName)
  const {
    limit,
    notThrowError,
    notCheckNextPage,
    filter
  } = paramsObj

  const _res = await _requestToApi(
    getREST,
    methodApi,
    paramsArr,
    args.auth
  )
  const res = _omitPrivateModelFields(_res)

  return prepareResponse(
    res,
    datePropName,
    limit,
    notThrowError,
    notCheckNextPage,
    symbols,
    symbPropName,
    methodApi,
    filter
  )
}

module.exports = {
  prepareResponse,
  prepareApiResponse
}
