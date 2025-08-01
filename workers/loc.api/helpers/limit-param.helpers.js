'use strict'

const getMethodLimit = (sendLimit, method, methodsLimits = {}) => {
  const _methodsLimits = {
    tickersHistory: { default: 100, max: 250, innerMax: 250 },
    positionsHistory: { default: 25, max: 50, innerMax: 100 },
    positionsAudit: { default: 100, max: 250, innerMax: 250 },
    ledgers: { default: 250, max: 500, innerMax: 2500 },
    trades: { default: 500, max: 1000, innerMax: 2500 },
    orderTrades: { default: 500, max: 1000, innerMax: 1000 },
    fundingTrades: { default: 500, max: 1000, innerMax: 1000 },
    publicTrades: { default: 500, max: 5000, innerMax: 10000 },
    orders: { default: 250, max: 500, innerMax: 2500 },
    movements: { default: 25, max: 25, innerMax: 1000 },
    fundingOfferHistory: { default: 100, max: 500, innerMax: 500 },
    fundingLoanHistory: { default: 100, max: 500, innerMax: 500 },
    fundingCreditHistory: { default: 100, max: 500, innerMax: 500 },
    logins: { default: 100, max: 250, innerMax: 250 },
    candles: { default: 500, max: 500, innerMax: 10000 },
    changeLogs: { default: 500, max: 500, innerMax: 500 },
    positionsSnapshot: { default: 50, max: 500, innerMax: 500 },
    payInvoiceList: { default: 10, max: 100, innerMax: 100 },
    ...methodsLimits
  }

  const selectedMethod = (
    _methodsLimits[method] &&
    typeof _methodsLimits[method] === 'object'
  )
    ? _methodsLimits[method]
    : { default: 25, max: 25, innerMax: 100 }
  const {
    max,
    default: defVal,
    innerMax
  } = selectedMethod
  const {
    isMax,
    isInnerMax,
    isNotMoreThanInnerMax
  } = { ...sendLimit }

  const limit = Number.isInteger(sendLimit?.limit)
    ? sendLimit?.limit
    : sendLimit
  const base = Number.isInteger(limit)
    ? limit
    : defVal

  if (isInnerMax) {
    return innerMax
  }
  if (isMax) {
    return max
  }
  if (isNotMoreThanInnerMax) {
    return getLimitNotMoreThan(base, innerMax)
  }

  return getLimitNotMoreThan(base, max)
}

const getReportFileArgs = (args, method, extraParams = {}) => {
  const reportFileArgs = {
    ...args,
    params: {
      ...args.params,
      ...extraParams
    }
  }

  if (method === 'getWeightedAverages') {
    return reportFileArgs
  }

  reportFileArgs.params.limit = getMethodLimit({ isMax: true }, method)

  return reportFileArgs
}

const getLimitNotMoreThan = (limit, maxLimit = 25) => {
  const num = limit || maxLimit
  return Math.min(num, maxLimit)
}

module.exports = {
  getMethodLimit,
  getReportFileArgs,
  getLimitNotMoreThan
}
