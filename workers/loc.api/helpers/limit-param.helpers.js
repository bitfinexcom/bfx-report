'use strict'

const getMethodLimit = (sendLimit, method, methodsLimits = {}) => {
  const _methodsLimits = {
    tickersHistory: { default: 100, max: 250 },
    positionsHistory: { default: 25, max: 50 },
    positionsAudit: { default: 100, max: 250 },
    ledgers: { default: 250, max: 500 },
    trades: { default: 500, max: 1000 },
    fundingTrades: { default: 500, max: 1000 },
    publicTrades: { default: 500, max: 5000 },
    orders: { default: 250, max: 500 },
    movements: { default: 25, max: 25 },
    fundingOfferHistory: { default: 100, max: 500 },
    fundingLoanHistory: { default: 100, max: 500 },
    fundingCreditHistory: { default: 100, max: 500 },
    ...methodsLimits
  }

  const selectedMethod = _methodsLimits[method] || { default: 25, max: 25 }

  if (sendLimit === 'max') return selectedMethod.max

  const base = sendLimit || selectedMethod.default

  return getLimitNotMoreThan(base, selectedMethod.max)
}

const getCsvArgs = (args, method, extraParams = {}) => {
  const csvArgs = {
    ...args,
    params: {
      ...args.params,
      ...extraParams,
      limit: getMethodLimit('max', method)
    }
  }

  return csvArgs
}

const getLimitNotMoreThan = (limit, maxLimit = 25) => {
  const num = limit || maxLimit
  return Math.min(num, maxLimit)
}

module.exports = {
  getMethodLimit,
  getCsvArgs,
  getLimitNotMoreThan
}
