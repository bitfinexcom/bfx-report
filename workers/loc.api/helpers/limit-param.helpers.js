'use strict'

const getMethodLimit = (sendLimit, method, methodsLimits = {}) => {
  const _methodsLimits = {
    tickersHistory: { default: 100, max: 250, innerMax: 10000 },
    positionsHistory: { default: 25, max: 50, innerMax: 10000 },
    positionsAudit: { default: 100, max: 250, innerMax: 2500 },
    ledgers: { default: 250, max: 500, innerMax: 2500 },
    trades: { default: 500, max: 1000, innerMax: 2500 },
    orderTrades: { default: 500, max: 1000, innerMax: 2500 },
    fundingTrades: { default: 500, max: 1000, innerMax: 1000 },
    publicTrades: { default: 500, max: 5000, innerMax: 5000 },
    orders: { default: 250, max: 500, innerMax: 2500 },
    movements: { default: 25, max: 25, innerMax: 250 },
    fundingOfferHistory: { default: 100, max: 500, innerMax: 10000 },
    fundingLoanHistory: { default: 100, max: 500, innerMax: 10000 },
    fundingCreditHistory: { default: 100, max: 500, innerMax: 10000 },
    ...methodsLimits
  }

  const selectedMethod = (
    _methodsLimits[method] &&
    typeof _methodsLimits[method] === 'object'
  )
    ? _methodsLimits[method]
    : { default: 25, max: 25, innerMax: 250 }
  const {
    max,
    default: defVal,
    innerMax
  } = selectedMethod
  const {
    isMax,
    isInnerMax
  } = { ...sendLimit }

  if (isInnerMax) {
    return innerMax
  }
  if (isMax) {
    return max
  }

  const base = Number.isInteger(sendLimit)
    ? sendLimit
    : defVal

  return getLimitNotMoreThan(base, max)
}

const getCsvArgs = (args, method, extraParams = {}) => {
  const csvArgs = {
    ...args,
    params: {
      ...args.params,
      ...extraParams,
      limit: getMethodLimit({ isMax: true }, method)
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
