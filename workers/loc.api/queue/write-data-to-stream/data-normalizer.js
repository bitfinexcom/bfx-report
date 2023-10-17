'use strict'

const { cloneDeep } = require('lib-js-util-base')

const { splitSymbolPairs } = require('../../helpers')

const _symbNormalizer = (obj, params) => {
  const { symbol } = { ...params }
  const _symbol = Array.isArray(symbol)
    ? symbol[0]
    : symbol

  if (typeof _symbol !== 'string') {
    return obj
  }

  return {
    ...obj,
    symbol: _symbol
  }
}

const _calcFee = (obj) => {
  const {
    fee,
    execAmount,
    execPrice,
    symbol,
    feeCurrency
  } = { ...obj }

  const [firstCurr, secondCurr] = splitSymbolPairs(symbol)

  if (feeCurrency === firstCurr) {
    return fee / execAmount
  }
  if (feeCurrency === secondCurr) {
    return fee / (execAmount * execPrice)
  }
}

const _tradesNormalizer = (obj) => {
  const calcedFee = _calcFee(obj)

  if (!Number.isFinite(calcedFee)) {
    return {
      ...obj,
      feePerc: '-'
    }
  }

  const res = Math.abs(calcedFee) * 100

  return {
    ...obj,
    feePerc: `${res.toFixed(2)}%`
  }
}

const _normalizers = {
  getPublicTrades: _symbNormalizer,
  getCandles: _symbNormalizer,
  getTrades: _tradesNormalizer
}

module.exports = (obj, method, params) => {
  if (
    typeof obj !== 'object' ||
    typeof _normalizers[method] !== 'function'
  ) {
    return obj
  }

  let res = cloneDeep(obj)

  try {
    res = _normalizers[method](res, params)
  } catch (err) {}

  return res
}
