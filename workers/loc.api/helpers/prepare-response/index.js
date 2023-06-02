'use strict'

const { MinLimitParamError } = require('../../errors')

const filterResponse = require('../filter-response')
const checkParams = require('../check-params')
const checkFilterParams = require('../check-filter-params')
const normalizeFilterParams = require('../normalize-filter-params')
const { getMethodLimit } = require('../limit-param.helpers')

const {
  getParamsSchemaName,
  omitPrivateModelFields,
  getBfxApiMethodName,
  getSymbolsForFiltering,
  getParams
} = require('./helpers')

const _requestToApi = (
  getREST,
  apiMethodName,
  params,
  auth
) => {
  const rest = getREST(auth)
  const bfxApiMethodName = getBfxApiMethodName(apiMethodName)

  const fn = rest[bfxApiMethodName].bind(rest)

  if (Array.isArray(params)) {
    return fn(...params)
  }

  return fn(params)
}

const _isNotContainedSameMts = (
  apiRes,
  apiMethodName,
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

const _getResAndParams = async (
  getREST,
  args,
  apiMethodName,
  symbPropName,
  opts = {}
) => {
  const {
    queryParams,
    allParams
  } = getParams(
    { args, apiMethodName, symbPropName },
    opts
  )

  const apiRes = await _requestToApi(
    getREST,
    apiMethodName,
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
  apiMethodName,
  filter,
  opts = {}
) => {
  const isCheckedNextPage = (
    !notCheckNextPage &&
    Array.isArray(apiRes) &&
    apiRes.length === limit &&
    _isNotContainedSameMts(
      apiRes,
      apiMethodName,
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

const prepareApiResponse = (
  getREST
) => async (
  reqArgs,
  apiMethodName,
  params = {}
) => {
  const {
    datePropName,
    symbPropName,
    requireFields,
    parseFieldsFn,
    isNotMoreThanInnerMax: _isNotMoreThanInnerMax
  } = params ?? {}
  const schemaName = getParamsSchemaName(apiMethodName)

  checkParams(reqArgs, schemaName, requireFields)
  const args = normalizeFilterParams(apiMethodName, reqArgs)
  checkFilterParams(apiMethodName, args)

  const symbols = getSymbolsForFiltering({ apiMethodName, symbPropName, args })
  const isSyncRequest = args?.params?.isSyncRequest
  const isNotMoreThanInnerMax = isSyncRequest || _isNotMoreThanInnerMax

  const resData = await _getResAndParams(
    getREST,
    args,
    apiMethodName,
    symbPropName,
    { isNotMoreThanInnerMax }
  )
  const isNotContainedSameMts = _isNotContainedSameMts(
    resData.apiRes,
    apiMethodName,
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
      apiMethodName,
      symbPropName,
      opts
    )
  const {
    limit,
    notThrowError,
    notCheckNextPage,
    filter
  } = allParams
  const omittedRes = omitPrivateModelFields(apiRes)
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
    apiMethodName,
    filter,
    opts
  )
}

module.exports = {
  prepareResponse,
  prepareApiResponse
}