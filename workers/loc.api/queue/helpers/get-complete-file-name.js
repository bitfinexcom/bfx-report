'use strict'

const { snakeCase } = require('lodash')
const uuidv4 = require('uuid/v4')

const _fileNamesMap = new Map([
  ['getTrades', 'trades'],
  ['getOrderTrades', 'order_trades'],
  ['getFundingTrades', 'funding_trades'],
  ['getPublicTrades', 'public_trades'],
  ['getPublicFunding', 'public_funding'],
  ['getLedgers', 'ledgers'],
  ['getOrders', 'orders'],
  ['getActiveOrders', 'active_orders'],
  ['getMovements', 'movements'],
  ['getFundingOfferHistory', 'funding_offers_history'],
  ['getFundingLoanHistory', 'funding_loans_history'],
  ['getFundingCreditHistory', 'funding_credits_history'],
  ['getPositionsHistory', 'positions_history'],
  ['getPositionsAudit', 'positions_audit'],
  ['getWallets', 'wallets'],
  ['getTickersHistory', 'tickers_history'],
  ['getActivePositions', 'active_positions']
])

const _getBaseName = (
  queueName,
  {
    isMultiExport,
    isDeposits,
    isWithdrawals,
    isTradingPair,
    fileNamesMap
  }
) => {
  const isValidFileNamesMap = (
    Array.isArray(fileNamesMap) &&
    fileNamesMap.every(item => (
      Array.isArray(item) &&
      typeof item[0] === 'string' &&
      typeof item[1] === 'string')
    )
  )
  const namesMap = new Map(
    [
      ..._fileNamesMap,
      ...(isValidFileNamesMap ? fileNamesMap : [])
    ]
  )

  if (
    queueName === 'getPublicTrades' &&
    !isTradingPair
  ) {
    return namesMap.get('getPublicFunding')
  }
  if (
    queueName === 'getMovements' &&
    (isDeposits || isWithdrawals)
  ) {
    return isDeposits
      ? 'deposits'
      : 'withdrawals'
  }
  if (isMultiExport) {
    return 'multiple-exports'
  }

  return namesMap.has(queueName)
    ? namesMap.get(queueName)
    : snakeCase(queueName.replace(/^get/, ''))
}

const _getDateString = mc => {
  return (new Date(mc)).toDateString().split(' ').join('-')
}

module.exports = (
  queueName,
  params,
  {
    userInfo,
    ext = 'csv',
    isMultiExport,
    isAddedUniqueEndingToCsvName
  } = {}
) => {
  const {
    start,
    end,
    isOnMomentInName
  } = params
  const baseName = _getBaseName(
    queueName,
    {
      ...params,
      isMultiExport
    }
  )

  const date = new Date()
  const formattedDateNow = _getDateString(date.getTime())
  const timestamp = date.toISOString().split(':').join('-')
  const startDate = start
    ? _getDateString(start)
    : _getDateString(0)
  const endDate = end
    ? _getDateString(end)
    : formattedDateNow
  const _ext = ext ? `.${ext}` : ''
  const _userInfo = userInfo ? `${userInfo}_` : ''
  const uniqEnding = isAddedUniqueEndingToCsvName
    ? `-${uuidv4()}`
    : ''
  const fileName = (
    queueName === 'getWallets' ||
    isMultiExport ||
    isOnMomentInName
  )
    ? `${_userInfo}${baseName}_MOMENT_${formattedDateNow}${uniqEnding}${_ext}`
    : `${_userInfo}${baseName}_FROM_${startDate}_TO_${endDate}_ON_${timestamp}${uniqEnding}${_ext}`

  return fileName
}
