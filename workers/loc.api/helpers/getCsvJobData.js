'use strict'

const {
  checkParams,
  getCsvArgs
} = require('./index')
const { FindMethodToGetCsvFileError } = require('../errors')

const getCsvJobData = {
  getTradesCsvJobData (args, userId, userInfo) {
    checkParams(args)

    const csvArgs = getCsvArgs(args, 'trades')

    const jobData = {
      userInfo,
      userId,
      name: 'getTrades',
      args: csvArgs,
      propNameForPagination: 'mtsCreate',
      columnsCsv: {
        id: '#',
        symbol: 'PAIR',
        execAmount: 'AMOUNT',
        execPrice: 'PRICE',
        fee: 'FEE',
        feeCurrency: 'FEE CURRENCY',
        mtsCreate: 'DATE',
        orderID: 'ORDER ID'
      },
      formatSettings: {
        mtsCreate: 'date',
        symbol: 'symbol'
      }
    }

    return jobData
  },
  getTickersHistoryCsvJobData (args, userId, userInfo) {
    checkParams(args, 'paramsSchemaForCsv', ['symbol'])

    const csvArgs = getCsvArgs(args, 'tickersHistory')
    const symb = Array.isArray(args.params.symbol)
      ? args.params.symbol
      : [args.params.symbol]
    const isTrading = symb.every(s => {
      return s && typeof s === 'string' && s[0] === 't'
    })
    const isFunding = symb.every(s => {
      return s && typeof s === 'string' && s[0] !== 't'
    })

    if (!isTrading && !isFunding) {
      throw new Error('ERR_SYMBOLS_ARE_NOT_OF_SAME_TYPE')
    }

    const tTickerHistColumns = {
      symbol: 'PAIR',
      bid: 'BID',
      ask: 'ASK',
      mtsUpdate: 'TIME'
    }
    const fTickerHistColumns = {
      symbol: 'PAIR',
      bid: 'BID',
      bidPeriod: 'BID PERIOD',
      ask: 'ASK',
      mtsUpdate: 'TIME'
    }

    const jobData = {
      userInfo,
      userId,
      name: 'getTickersHistory',
      args: csvArgs,
      propNameForPagination: 'mtsUpdate',
      columnsCsv: isTrading ? tTickerHistColumns : fTickerHistColumns,
      formatSettings: {
        mtsUpdate: 'date',
        symbol: 'symbol'
      }
    }

    return jobData
  },
  getWalletsCsvJobData (args, userId, userInfo) {
    checkParams(args, 'paramsSchemaForWalletsCsv')

    const jobData = {
      userInfo,
      userId,
      name: 'getWallets',
      args,
      propNameForPagination: 'mtsUpdate',
      columnsCsv: {
        type: 'TYPE',
        currency: 'CURRENCY',
        balance: 'BALANCE'
      }
    }

    return jobData
  }
}

const getMultipleCsvJobData = (
  reportService,
  args,
  userId,
  userInfo
) => {
  checkParams(args, 'paramsSchemaForMultipleCsv', false, true)

  const jobsData = args.params.multiExport.map(params => {
    const getJobDataMethodName = `${params.method}JobData`
    const hasGetJobDataMethod = Object.keys(getCsvJobData).every((name) => {
      return name !== getJobDataMethodName
    })

    if (
      hasGetJobDataMethod ||
      typeof reportService[params.method] !== 'function'
    ) {
      throw new FindMethodToGetCsvFileError()
    }

    return getCsvJobData[getJobDataMethodName].bind(getCsvJobData)(
      {
        ...args,
        params: { ...params }
      },
      userId,
      userInfo
    )
  })

  return {
    userInfo,
    userId,
    name: 'getMultiple',
    args,
    jobsData
  }
}

module.exports = {
  ...getCsvJobData,
  getMultipleCsvJobData
}
