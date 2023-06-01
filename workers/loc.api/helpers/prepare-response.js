'use strict'

const {
  cloneDeep,
  isEmpty,
  omit
} = require('lodash')

const filterResponse = require('./filter-response')
const checkParams = require('./check-params')
const checkFilterParams = require('./check-filter-params')
const normalizeFilterParams = require('./normalize-filter-params')
const { getMethodLimit } = require('./limit-param.helpers')
const { getDateNotMoreNow } = require('./date-param.helpers')
const {
  MinLimitParamError,
  LedgerPaymentFilteringParamsError
} = require('../errors')

const _paramsMap = {
  default: {
    symbol: 'symbol',
    start: 'start',
    end: 'end',
    limit: 'limit'
  },

  candles: {
    timeframe: 'timeframe',
    symbol: 'symbol',
    section: 'section',
    sort: 'query.sort',
    start: 'query.start',
    end: 'query.end',
    limit: 'query.limit'
  },
  ledgers: {
    start: 'start',
    end: 'end',
    limit: 'limit',
    symbol: 'filters.ccy',
    category: 'filters.category'
  },
  statusMessages: {
    type: 'type',
    symbol: 'keys'
  },
  positionsAudit: {
    start: 'start',
    end: 'end',
    limit: 'limit',
    id: 'id'
  },
  orderTrades: {
    start: 'start',
    end: 'end',
    limit: 'limit',
    id: 'orderId'
  },
  tickersHistory: {
    symbol: 'symbols',
    start: 'start',
    end: 'end',
    limit: 'limit'
  },
  payInvoiceList: {
    start: 'start',
    end: 'end',
    limit: 'limit',
    id: 'id'
  },
  trades: {
    symbol: 'symbol',
    start: 'start',
    end: 'end',
    limit: 'limit',
    sort: 'sort'
  },
  accountTrades: {
    symbol: 'symbol',
    start: 'start',
    end: 'end',
    limit: 'limit',
    sort: 'sort'
  },
  movements: {
    symbol: 'ccy',
    start: 'start',
    end: 'end',
    limit: 'limit',
    address: 'address',
    id: 'id'
  }
}

const _paramsSchemasMap = {
  payInvoiceList: 'paramsSchemaForPayInvoiceList',
  statusMessages: 'paramsSchemaForStatusMessagesApi',
  publicTrades: 'paramsSchemaForPublicTrades',
  positionsAudit: 'paramsSchemaForPositionsAudit',
  orderTrades: 'paramsSchemaForOrderTradesApi',
  candles: 'paramsSchemaForCandlesApi',
  default: 'paramsSchemaForApi'
}

const _getParamsMap = (
  method,
  map = _paramsMap
) => {
  return map?.[method] ?? map.default
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
    !args?.params?.symbol ||
    methodApi === 'candles' ||
    methodApi === 'publicTrades'
  ) {
    return null
  }

  const symbol = args.params.symbol

  if (
    methodApi === 'positionsHistory' ||
    methodApi === 'positionsAudit' ||
    methodApi === 'payInvoiceList'
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

const _getSymbolParams = (
  methodApi,
  params,
  symbPropName
) => {
  const {
    isMarginFundingPayment,
    isAffiliateRebate,
    isStakingPayments,
    symbol,
    category
  } = params ?? {}

  if (methodApi === 'payInvoiceList') {
    return { symbol: null }
  }
  if (
    methodApi === 'candles' ||
    methodApi === 'publicTrades'
  ) {
    return {
      symbol: Array.isArray(symbol)
        ? symbol[0]
        : symbol
    }
  }
  if (methodApi === 'statusMessages') {
    const _symbol = isEmpty(symbol)
      ? 'ALL'
      : symbol

    return {
      symbol: Array.isArray(_symbol)
        ? _symbol
        : [_symbol]
    }
  }
  if (
    methodApi === 'ledgers' &&
    (
      isMarginFundingPayment ||
      isAffiliateRebate ||
      isStakingPayments ||
      category
    )
  ) {
    if ([
      isMarginFundingPayment,
      isAffiliateRebate,
      isStakingPayments,
      category
    ].filter(f => f).length > 1) {
      throw new LedgerPaymentFilteringParamsError()
    }

    const symbArr = Array.isArray(symbol)
      ? symbol
      : [symbol]
    const ccy = symbArr.length > 1
      ? null
      : symbArr[0]

    if (category) {
      const normCategory = typeof category === 'string'
        ? Number.parseFloat(category)
        : category

      return { symbol: ccy, category: normCategory }
    }
    if (isAffiliateRebate) {
      return { symbol: ccy, category: 241 }
    }
    if (isStakingPayments) {
      return { symbol: ccy, category: 262 }
    }

    return { symbol: ccy, category: 28 }
  }
  if (
    typeof symbPropName === 'string' &&
    methodApi !== 'positionsHistory' &&
    methodApi !== 'positionsAudit' &&
    Array.isArray(symbol)
  ) {
    return {
      symbol: symbol.length > 1
        ? null
        : symbol[0]
    }
  }
  if (
    !symbol &&
    methodApi === 'fundingTrades'
  ) {
    return { symbol: null }
  }

  return { symbol }
}

const _getParams = (
  args,
  methodApi,
  symbPropName,
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
    ..._getSymbolParams(methodApi, params, symbPropName),
    end: getDateNotMoreNow(params.end),
    limit: getMethodLimit(limit, methodApi)
  }
  const paramsMap = _getParamsMap(methodApi)
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
  params,
  auth
) => {
  const rest = getREST(auth)
  const fn = rest[_parseMethodApi(method)].bind(rest)

  if (Array.isArray(params)) {
    return fn(...params)
  }

  return fn(params)
}

const _isNotContainedSameMts = (
  apiRes,
  methodApi,
  datePropName,
  limit,
  opts = {}
) => {
  if (!Array.isArray(apiRes)) {
    return false
  }

  const {
    isMax = true,
    isInnerMax,
    isNotMoreThanInnerMax
  } = opts ?? {}
  const firstElem = apiRes[0] ?? {}
  const mts = firstElem?.[datePropName]
  const methodLimit = getMethodLimit(
    { isMax, isInnerMax, isNotMoreThanInnerMax },
    methodApi
  )

  return (
    apiRes.length === 0 ||
    methodLimit > limit ||
    apiRes.some((item) => (
      item?.[datePropName] !== mts
    ))
  )
}

const _getResAndParams = async (
  getREST,
  args,
  methodApi,
  symbPropName,
  opts = {}
) => {
  const {
    queryParams,
    allParams
  } = _getParams(args, methodApi, symbPropName, opts)

  const apiRes = await _requestToApi(
    getREST,
    methodApi,
    queryParams,
    args.auth
  )

  return {
    apiRes,
    allParams
  }
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
  filter,
  opts = {}
) => {
  const isCheckedNextPage = (
    !notCheckNextPage &&
    Array.isArray(apiRes) &&
    apiRes.length === limit &&
    _isNotContainedSameMts(
      apiRes,
      methodApi,
      datePropName,
      limit,
      opts
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
      { $in: { [symbPropName]: symbols } },
      true
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
    '_fieldKeys',
    '_apiInterface'
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
  reqArgs,
  methodApi,
  params = {}
) => {
  const {
    datePropName,
    symbPropName,
    requireFields,
    parseFieldsFn,
    isNotMoreThanInnerMax: _isNotMoreThanInnerMax
  } = params ?? {}
  const schemaName = _getSchemaNameByMethodName(methodApi)

  checkParams(reqArgs, schemaName, requireFields)
  const args = normalizeFilterParams(methodApi, reqArgs)
  checkFilterParams(methodApi, args)

  const symbols = _getSymbols(methodApi, symbPropName, args)
  const isSyncRequest = args?.params?.isSyncRequest
  const isNotMoreThanInnerMax = isSyncRequest || _isNotMoreThanInnerMax

  const resData = await _getResAndParams(
    getREST,
    args,
    methodApi,
    symbPropName,
    { isNotMoreThanInnerMax }
  )
  const isNotContainedSameMts = _isNotContainedSameMts(
    resData.apiRes,
    methodApi,
    datePropName,
    resData.allParams.limit,
    { isNotMoreThanInnerMax }
  )
  const opts = isNotContainedSameMts
    ? { isMax: true, isNotMoreThanInnerMax }
    : { isInnerMax: true, isNotMoreThanInnerMax }
  const {
    apiRes,
    allParams
  } = isNotContainedSameMts
    ? resData
    : await _getResAndParams(
      getREST,
      args,
      methodApi,
      symbPropName,
      opts
    )
  const {
    limit,
    notThrowError,
    notCheckNextPage,
    filter
  } = allParams
  const omittedRes = _omitPrivateModelFields(apiRes)
  const res = typeof parseFieldsFn === 'function'
    ? parseFieldsFn(omittedRes)
    : omittedRes

  return prepareResponse(
    res,
    datePropName,
    limit,
    notThrowError,
    notCheckNextPage,
    symbols,
    symbPropName,
    methodApi,
    filter,
    opts
  )
}

module.exports = {
  prepareResponse,
  prepareApiResponse
}
