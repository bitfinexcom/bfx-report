'use strict'

const { v4: uuidv4 } = require('uuid')
const { capitalize } = require('lib-js-util-base')

const getReportFileExtName = require('./get-report-file-ext-name')

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
  ['getActivePositions', 'active_positions'],
  ['getLogins', 'logins'],
  ['getChangeLogs', 'change_logs']
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
  if (namesMap.has(queueName)) {
    return namesMap.get(queueName)
  }

  return queueName
    .replace(/^get/, '')
    .replace(/[A-Z]/g, (match, offset) => (
      `${offset > 0 ? '_' : ''}${match.toLowerCase()}`
    ))
}

const _getDateString = mc => {
  return (new Date(mc)).toDateString().split(' ').join('-')
}

const _getUniqEnding = (uniqEnding = '') => {
  return uniqEnding && typeof uniqEnding === 'string'
    ? `-${uniqEnding}`
    : `-${uuidv4()}`
}

module.exports = (
  queueName,
  params,
  {
    userInfo,
    isMultiExport,
    isAddedUniqueEndingToReportFileName,
    uniqEnding = ''
  } = {}
) => {
  const ext = getReportFileExtName(params)
  const {
    start,
    end,
    isBaseNameInName
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
  const _uniqEnding = isAddedUniqueEndingToReportFileName
    ? _getUniqEnding(uniqEnding)
    : ''

  const mainMetadata = {
    userInfo: _userInfo,
    baseName,
    readableBaseName: capitalize(baseName.replace('_', ' ')),
    date,
    formattedDateNow,
    timestamp,
    uniqEnding,
    ext
  }

  if (
    isBaseNameInName ||
    isMultiExport
  ) {
    return {
      ...mainMetadata,

      fileName: `${_userInfo}${baseName}_${formattedDateNow}${_uniqEnding}${_ext}`
    }
  }

  return {
    ...mainMetadata,

    fileName: `${_userInfo}${baseName}_FROM_${startDate}_TO_${endDate}_ON_${timestamp}${_uniqEnding}${_ext}`
  }
}
