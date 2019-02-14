'use strict'

const {
  checkParams,
  getCsvArgs,
  checkTimeLimit,
  hasJobInQueueWithStatusBy
} = require('./index')
const { FindMethodToGetCsvFileError } = require('../errors')

const _checkJobAndGetUserData = async (
  reportService,
  args,
  uId,
  uInfo
) => {
  const userId = Number.isInteger(uId)
    ? uId
    : await hasJobInQueueWithStatusBy(reportService, args)
  const userInfo = uInfo && typeof uInfo === 'string'
    ? uInfo
    : await reportService._getUsername(args)

  return {
    userId,
    userInfo
  }
}

const getCsvJobData = {
  async getTradesCsvJobData (
    reportService,
    args,
    uId,
    uInfo
  ) {
    checkParams(args)

    const {
      userId,
      userInfo
    } = await _checkJobAndGetUserData(
      reportService,
      args,
      uId,
      uInfo
    )

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
  async getTickersHistoryCsvJobData (
    reportService,
    args,
    uId,
    uInfo
  ) {
    checkParams(args, 'paramsSchemaForCsv', ['symbol'])

    const {
      userId,
      userInfo
    } = await _checkJobAndGetUserData(
      reportService,
      args,
      uId,
      uInfo
    )

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
  async getWalletsCsvJobData (
    reportService,
    args,
    uId,
    uInfo
  ) {
    checkParams(args, 'paramsSchemaForWalletsCsv')

    const {
      userId,
      userInfo
    } = await _checkJobAndGetUserData(
      reportService,
      args,
      uId,
      uInfo
    )

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
  },
  async getPositionsHistoryCsvJobData (
    reportService,
    args,
    uId,
    uInfo
  ) {
    checkParams(args)

    const {
      userId,
      userInfo
    } = await _checkJobAndGetUserData(
      reportService,
      args,
      uId,
      uInfo
    )

    const csvArgs = getCsvArgs(args, 'positionsHistory')

    const jobData = {
      userInfo,
      userId,
      name: 'getPositionsHistory',
      args: csvArgs,
      propNameForPagination: 'mtsUpdate',
      columnsCsv: {
        id: '#',
        symbol: 'PAIR',
        amount: 'AMOUNT',
        basePrice: 'BASE PRICE',
        closePrice: 'CLOSE PRICE',
        pl: 'P/L',
        plPerc: 'P/L%',
        marginFunding: 'FUNDING COST',
        marginFundingType: 'FUNDING TYPE',
        status: 'STATUS',
        mtsUpdate: 'UPDATED',
        mtsCreate: 'CREATED',
        leverage: 'LEVERAGE'
      },
      formatSettings: {
        mtsUpdate: 'date',
        mtsCreate: 'date',
        symbol: 'symbol'
      }
    }

    return jobData
  },
  async getPositionsAuditCsvJobData (
    reportService,
    args,
    uId,
    uInfo
  ) {
    checkParams(args, 'paramsSchemaForPositionsAuditCsv', ['id'])

    const {
      userId,
      userInfo
    } = await _checkJobAndGetUserData(
      reportService,
      args,
      uId,
      uInfo
    )

    const csvArgs = getCsvArgs(args, 'positionsAudit')

    const jobData = {
      userInfo,
      userId,
      name: 'getPositionsAudit',
      args: csvArgs,
      propNameForPagination: 'mtsUpdate',
      columnsCsv: {
        id: '#',
        symbol: 'PAIR',
        amount: 'AMOUNT',
        basePrice: 'BASE PRICE',
        liquidationPrice: 'LIQ PRICE',
        pl: 'P/L',
        plPerc: 'P/L%',
        marginFunding: 'FUNDING COST',
        marginFundingType: 'FUNDING TYPE',
        status: 'STATUS',
        mtsUpdate: 'UPDATED',
        mtsCreate: 'CREATED',
        leverage: 'LEVERAGE'
      },
      formatSettings: {
        mtsUpdate: 'date',
        mtsCreate: 'date',
        symbol: 'symbol'
      }
    }

    return jobData
  },
  async getPublicTradesCsvJobData (
    reportService,
    args,
    uId,
    uInfo
  ) {
    checkParams(args, 'paramsSchemaForPublicTradesCsv', ['symbol'])
    checkTimeLimit(args)

    const {
      userId,
      userInfo
    } = await _checkJobAndGetUserData(
      reportService,
      args,
      uId,
      uInfo
    )

    const csvArgs = getCsvArgs(args, 'publicTrades')

    const jobData = {
      userInfo,
      userId,
      name: 'getPublicTrades',
      args: csvArgs,
      propNameForPagination: 'mts',
      columnsCsv: {
        id: '#',
        mts: 'TIME',
        price: 'PRICE',
        amount: 'AMOUNT',
        symbol: 'PAIR'
      },
      formatSettings: {
        mts: 'date',
        symbol: 'symbol'
      }
    }

    return jobData
  },
  async getLedgersCsvJobData (
    reportService,
    args,
    uId,
    uInfo
  ) {
    checkParams(args)

    const {
      userId,
      userInfo
    } = await _checkJobAndGetUserData(
      reportService,
      args,
      uId,
      uInfo
    )

    const csvArgs = getCsvArgs(args, 'ledgers')

    const jobData = {
      userInfo,
      userId,
      name: 'getLedgers',
      args: csvArgs,
      propNameForPagination: 'mts',
      columnsCsv: {
        description: 'DESCRIPTION',
        currency: 'CURRENCY',
        amount: 'AMOUNT',
        balance: 'BALANCE',
        mts: 'DATE',
        wallet: 'WALLET'
      },
      formatSettings: {
        mts: 'date'
      }
    }

    return jobData
  },
  async getOrdersCsvJobData (
    reportService,
    args,
    uId,
    uInfo
  ) {
    checkParams(args)

    const {
      userId,
      userInfo
    } = await _checkJobAndGetUserData(
      reportService,
      args,
      uId,
      uInfo
    )

    const csvArgs = getCsvArgs(args, 'orders')

    const jobData = {
      userInfo,
      userId,
      name: 'getOrders',
      args: csvArgs,
      propNameForPagination: 'mtsUpdate',
      columnsCsv: {
        id: '#',
        symbol: 'PAIR',
        type: 'TYPE',
        amountOrig: 'AMOUNT',
        amountExecuted: 'EXECUTED AMOUNT',
        price: 'PRICE',
        priceAvg: 'AVERAGE EXECUTION PRICE',
        mtsCreate: 'CREATED',
        mtsUpdate: 'UPDATED',
        status: 'STATUS'
      },
      formatSettings: {
        mtsUpdate: 'date',
        mtsCreate: 'date',
        symbol: 'symbol'
      }
    }

    return jobData
  },
  async getMovementsCsvJobData (
    reportService,
    args,
    uId,
    uInfo
  ) {
    checkParams(args)

    const {
      userId,
      userInfo
    } = await _checkJobAndGetUserData(
      reportService,
      args,
      uId,
      uInfo
    )

    const csvArgs = getCsvArgs(args, 'movements')

    const jobData = {
      userInfo,
      userId,
      name: 'getMovements',
      args: csvArgs,
      propNameForPagination: 'mtsUpdated',
      columnsCsv: {
        id: '#',
        mtsUpdated: 'DATE',
        currency: 'CURRENCY',
        status: 'STATUS',
        amount: 'AMOUNT',
        fees: 'FEES',
        destinationAddress: 'DESCRIPTION'
      },
      formatSettings: {
        mtsUpdated: 'date'
      }
    }

    return jobData
  },
  async getFundingOfferHistoryCsvJobData (
    reportService,
    args,
    uId,
    uInfo
  ) {
    checkParams(args)

    const {
      userId,
      userInfo
    } = await _checkJobAndGetUserData(
      reportService,
      args,
      uId,
      uInfo
    )

    const csvArgs = getCsvArgs(args, 'fundingOfferHistory')

    const jobData = {
      userInfo,
      userId,
      name: 'getFundingOfferHistory',
      args: csvArgs,
      propNameForPagination: 'mtsUpdate',
      columnsCsv: {
        id: '#',
        symbol: 'CURRENCY',
        amountOrig: 'AMOUNT',
        amountExecuted: 'EXECUTED AMOUNT',
        type: 'TYPE',
        status: 'STATUS',
        rate: 'RATE',
        period: 'PERIOD',
        mtsUpdate: 'UPDATED',
        mtsCreate: 'CREATED'
      },
      formatSettings: {
        mtsUpdate: 'date',
        mtsCreate: 'date',
        symbol: 'symbol'
      }
    }

    return jobData
  },
  async getFundingLoanHistoryCsvJobData (
    reportService,
    args,
    uId,
    uInfo
  ) {
    checkParams(args)

    const {
      userId,
      userInfo
    } = await _checkJobAndGetUserData(
      reportService,
      args,
      uId,
      uInfo
    )

    const csvArgs = getCsvArgs(args, 'fundingLoanHistory')

    const jobData = {
      userInfo,
      userId,
      name: 'getFundingLoanHistory',
      args: csvArgs,
      propNameForPagination: 'mtsUpdate',
      columnsCsv: {
        id: '#',
        symbol: 'CURRENCY',
        side: 'SIDE',
        amount: 'AMOUNT',
        status: 'STATUS',
        rate: 'RATE',
        period: 'PERIOD',
        mtsOpening: 'OPENED',
        mtsLastPayout: 'CLOSED',
        mtsUpdate: 'DATE'
      },
      formatSettings: {
        side: 'side',
        mtsUpdate: 'date',
        mtsOpening: 'date',
        mtsLastPayout: 'date',
        symbol: 'symbol'
      }
    }

    return jobData
  },
  async getFundingCreditHistoryCsvJobData (
    reportService,
    args,
    uId,
    uInfo
  ) {
    checkParams(args)

    const {
      userId,
      userInfo
    } = await _checkJobAndGetUserData(
      reportService,
      args,
      uId,
      uInfo
    )

    const csvArgs = getCsvArgs(args, 'fundingCreditHistory')

    const jobData = {
      userInfo,
      userId,
      name: 'getFundingCreditHistory',
      args: csvArgs,
      propNameForPagination: 'mtsUpdate',
      columnsCsv: {
        id: '#',
        symbol: 'CURRENCY',
        amount: 'AMOUNT',
        rate: 'RATE',
        period: 'PERIOD',
        mtsOpening: 'OPENED',
        mtsLastPayout: 'CLOSED',
        mtsUpdate: 'DATE',
        side: 'SIDE',
        status: 'STATUS',
        positionPair: 'POSITION PAIR'
      },
      formatSettings: {
        side: 'side',
        mtsUpdate: 'date',
        mtsOpening: 'date',
        mtsLastPayout: 'date',
        symbol: 'symbol'
      }
    }

    return jobData
  }
}

const getMultipleCsvJobData = async (
  reportService,
  args,
  uId,
  uInfo
) => {
  checkParams(args, 'paramsSchemaForMultipleCsv', false, true)

  const {
    userId,
    userInfo
  } = await _checkJobAndGetUserData(
    reportService,
    args,
    uId,
    uInfo
  )

  const jobsData = []

  for (const params of args.params.multiExport) {
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

    const jobData = await getCsvJobData[getJobDataMethodName](
      reportService,
      {
        ...args,
        params: { ...params }
      },
      userId,
      userInfo
    )

    jobsData.push(jobData)
  }

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
