'use strict'

const { isEmpty } = require('lib-js-util-base')

const {
  LedgerPaymentFilteringParamsError
} = require('../../../errors')

module.exports = ({
  apiMethodName,
  params,
  symbPropName
}) => {
  const {
    isMarginFundingPayment,
    isAffiliateRebate,
    isStakingPayments,
    symbol,
    category
  } = params ?? {}

  if (
    apiMethodName === 'candles' ||
    apiMethodName === 'publicTrades'
  ) {
    return {
      symbol: Array.isArray(symbol)
        ? symbol[0]
        : symbol
    }
  }
  if (apiMethodName === 'statusMessages') {
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
    apiMethodName === 'ledgers' &&
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
    apiMethodName !== 'positionsHistory' &&
    apiMethodName !== 'positionsAudit' &&
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
    apiMethodName === 'fundingTrades'
  ) {
    return { symbol: null }
  }

  return { symbol }
}
