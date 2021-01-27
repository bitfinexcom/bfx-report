'use strict'

const {
  cloneDeep,
  isEmpty,
  omit,
  pick
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

const _paramsOrderMap = {
  positionsSnapshot: [
    'start',
    'end',
    'limit'
  ],
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
  logins: [
    'start',
    'end',
    'limit'
  ],
  changeLogs: [
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
  statusMessages: 'paramsSchemaForStatusMessagesApi',
  publicTrades: 'paramsSchemaForPublicTrades',
  positionsAudit: 'paramsSchemaForPositionsAudit',
  orderTrades: 'paramsSchemaForOrderTradesApi',
  candles: 'paramsSchemaForCandlesApi',
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
    methodApi === 'candles' ||
    methodApi === 'publicTrades'
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
  params,
  symbPropName
) => {
  const {
    isMarginFundingPayment,
    isAffiliateRebate,
    isStakingPayments,
    symbol,
    category
  } = { ...params }

  if (
    methodApi === 'candles' ||
    methodApi === 'publicTrades'
  ) {
    return Array.isArray(symbol)
      ? symbol[0]
      : symbol
  }
  if (methodApi === 'statusMessages') {
    const _symbol = isEmpty(symbol)
      ? 'ALL'
      : symbol

    return Array.isArray(_symbol)
      ? _symbol
      : [_symbol]
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

      return { ccy, category: normCategory }
    }
    if (isAffiliateRebate) {
      return { ccy, category: 241 }
    }
    if (isStakingPayments) {
      return { ccy, category: 262 }
    }

    return { ccy, category: 28 }
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
  symbPropName,
  opts = {}
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

  const { params } = { ...args }
  const { isInnerMax } = { ...opts }
  const limit = isInnerMax
    ? { isInnerMax }
    : params.limit
  const paramsObj = {
    ...cloneDeep(params),
    end: getDateNotMoreNow(params.end),
    limit: getMethodLimit(limit, methodApi),
    symbol: _getSymbolParam(methodApi, params, symbPropName)
  }

  if (methodApi === 'candles') {
    const query = pick(paramsObj, [
      'limit',
      'start',
      'end',
      'sort'
    ])
    const _params = pick(paramsObj, [
      'section',
      'timeframe',
      'symbol'
    ])
    const paramsArr = [{ ..._params, query }]

    return {
      paramsArr,
      paramsObj
    }
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
  limit,
  opts = {}
) => {
  if (!Array.isArray(apiRes)) {
    return false
  }

  const { isMax = true, isInnerMax } = { ...opts }
  const firstElem = { ...apiRes[0] }
  const mts = firstElem[datePropName]
  const methodLimit = getMethodLimit(
    { isMax, isInnerMax },
    methodApi
  )

  return (
    apiRes.length === 0 ||
    methodLimit > limit ||
    apiRes.some((item) => {
      const _item = { ...item }
      const _mts = _item[datePropName]

      return _mts !== mts
    })
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
    paramsArr,
    paramsObj
  } = _getParams(args, methodApi, symbPropName, opts)

  const apiRes = await _requestToApi(
    getREST,
    methodApi,
    paramsArr,
    args.auth
  )

  return {
    apiRes,
    paramsObj
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
    parseFieldsFn
  } = { ...params }
  const schemaName = _getSchemaNameByMethodName(methodApi)

  checkParams(reqArgs, schemaName, requireFields)
  const args = normalizeFilterParams(methodApi, reqArgs)
  checkFilterParams(methodApi, args)

  const symbols = _getSymbols(methodApi, symbPropName, args)

  const resData = await _getResAndParams(
    getREST,
    args,
    methodApi,
    symbPropName
  )
  const isNotContainedSameMts = _isNotContainedSameMts(
    resData.apiRes,
    methodApi,
    datePropName,
    resData.paramsObj.limit
  )
  const opts = isNotContainedSameMts
    ? { isMax: true }
    : { isInnerMax: true }
  const {
    apiRes,
    paramsObj
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
  } = paramsObj
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
