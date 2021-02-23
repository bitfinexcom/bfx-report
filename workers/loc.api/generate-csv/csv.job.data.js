'use strict'

const {
  decorate,
  injectable,
  inject
} = require('inversify')

const TYPES = require('../di/types')

const {
  checkParams,
  getCsvArgs,
  checkTimeLimit,
  checkJobAndGetUserData,
  parsePositionsAuditId
} = require('../helpers')
const {
  FindMethodToGetCsvFileError,
  SymbolsTypeError
} = require('../errors')

class CsvJobData {
  constructor (rService) {
    this.rService = rService
  }

  async getTradesCsvJobData (
    args,
    uId,
    uInfo
  ) {
    checkParams(args)

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
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
        feePerc: 'FEE PERC',
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
  }

  async getFundingTradesCsvJobData (
    args,
    uId,
    uInfo
  ) {
    checkParams(args)

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const csvArgs = getCsvArgs(args, 'fundingTrades')

    const jobData = {
      userInfo,
      userId,
      name: 'getFundingTrades',
      args: csvArgs,
      propNameForPagination: 'mtsCreate',
      columnsCsv: {
        id: '#',
        symbol: 'PAIR',
        amount: 'AMOUNT',
        rate: 'RATE',
        period: 'PERIOD',
        maker: 'MAKER',
        mtsCreate: 'DATE',
        offerID: 'OFFER ID'
      },
      formatSettings: {
        mtsCreate: 'date',
        symbol: 'symbol'
      }
    }

    return jobData
  }

  async getTickersHistoryCsvJobData (
    args,
    uId,
    uInfo
  ) {
    checkParams(args, 'paramsSchemaForCsv', ['symbol'])

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
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
      throw new SymbolsTypeError()
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
  }

  async getWalletsCsvJobData (
    args,
    uId,
    uInfo
  ) {
    checkParams(args, 'paramsSchemaForWalletsCsv')

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
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
  }

  async getPositionsHistoryCsvJobData (
    args,
    uId,
    uInfo
  ) {
    checkParams(args)

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
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
  }

  async getActivePositionsCsvJobData (
    args,
    uId,
    uInfo
  ) {
    checkParams(args, 'paramsSchemaForActivePositionsCsv')

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const jobData = {
      userInfo,
      userId,
      name: 'getActivePositions',
      args,
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
        leverage: 'LEVERAGE',
        collateral: 'COLLATERAL',
        collateralMin: 'MIN COLLATERAL',
        meta: 'META INFORMATION'
      },
      formatSettings: {
        mtsUpdate: 'date',
        mtsCreate: 'date',
        symbol: 'symbol'
      }
    }

    return jobData
  }

  async getPositionsAuditCsvJobData (
    args,
    uId,
    uInfo
  ) {
    const _args = parsePositionsAuditId(args)
    checkParams(_args, 'paramsSchemaForPositionsAuditCsv', ['id'])

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const csvArgs = getCsvArgs(_args, 'positionsAudit')

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
        marginFunding: 'FUNDING COST',
        marginFundingType: 'FUNDING TYPE',
        status: 'STATUS',
        mtsUpdate: 'UPDATED',
        mtsCreate: 'CREATED',
        leverage: 'LEVERAGE',
        collateral: 'COLLATERAL',
        collateralMin: 'MIN COLLATERAL',
        meta: 'META INFORMATION'
      },
      formatSettings: {
        mtsUpdate: 'date',
        mtsCreate: 'date',
        symbol: 'symbol'
      }
    }

    return jobData
  }

  async getPublicTradesCsvJobData (
    args,
    uId,
    uInfo
  ) {
    checkParams(args, 'paramsSchemaForPublicTradesCsv', ['symbol'])
    checkTimeLimit(args)

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const params = { ...args.params }
    const isTradingPair = Array.isArray(params.symbol)
      ? params.symbol[0].startsWith('t')
      : params.symbol.startsWith('t')
    const csvArgs = getCsvArgs(args, 'publicTrades', { isTradingPair })
    const columnsCsv = (isTradingPair)
      ? {
          id: '#',
          mts: 'TIME',
          price: 'PRICE',
          amount: 'AMOUNT',
          symbol: 'PAIR'
        }
      : {
          id: '#',
          mts: 'TIME',
          rate: 'RATE',
          amount: 'AMOUNT',
          period: 'PERIOD',
          symbol: 'CURRENCY'
        }

    const jobData = {
      userInfo,
      userId,
      name: 'getPublicTrades',
      args: csvArgs,
      propNameForPagination: 'mts',
      columnsCsv,
      formatSettings: {
        mts: 'date',
        symbol: 'symbol'
      }
    }

    return jobData
  }

  async getStatusMessagesCsvJobData (
    args,
    uId,
    uInfo
  ) {
    checkParams(args, 'paramsSchemaForStatusMessagesCsv')

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const jobData = {
      userInfo,
      userId,
      name: 'getStatusMessages',
      args,
      propNameForPagination: 'timestamp',
      columnsCsv: {
        key: 'PAIR',
        price: 'DERIV PRICE',
        priceSpot: 'SPOT PRICE',
        fundBal: 'INSURANCE RUND BALANCE',
        fundingAccrued: 'NEXT FUNDING ACCRUED',
        fundingStep: 'NEXT FUNDING STEP',
        timestamp: 'UPDATED'
      },
      formatSettings: {
        timestamp: 'date',
        key: 'symbol'
      }
    }

    return jobData
  }

  async getCandlesCsvJobData (
    args,
    uId,
    uInfo
  ) {
    checkParams(args, 'paramsSchemaForCandlesCsv', ['symbol'])
    checkTimeLimit(args)

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const jobData = {
      userInfo,
      userId,
      name: 'getCandles',
      args,
      propNameForPagination: 'mts',
      columnsCsv: {
        mts: 'TIME',
        open: 'FIRST EXECUTION',
        close: 'LAST EXECUTION',
        high: 'HIGHEST EXECUTION',
        low: 'LOWEST EXECUTION',
        volume: 'QUANTITY',
        symbol: 'PAIR'
      },
      formatSettings: {
        mts: 'date',
        symbol: 'symbol'
      }
    }

    return jobData
  }

  async getLedgersCsvJobData (
    args,
    uId,
    uInfo
  ) {
    checkParams(args)

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
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
        id: '#',
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
  }

  async getOrderTradesCsvJobData (
    args,
    uId,
    uInfo
  ) {
    checkParams(args, 'paramsSchemaForOrderTradesCsv')

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const csvArgs = getCsvArgs(args, 'orderTrades')

    const jobData = {
      userInfo,
      userId,
      name: 'getOrderTrades',
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
  }

  async getOrdersCsvJobData (
    args,
    uId,
    uInfo
  ) {
    checkParams(args)

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
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
        typePrev: 'PREVIOUS ORDER TYPE',
        amountOrig: 'AMOUNT',
        amountExecuted: 'EXECUTED AMOUNT',
        price: 'PRICE',
        priceAvg: 'AVERAGE EXECUTION PRICE',
        priceTrailing: 'TRAILING PRICE',
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
  }

  async getActiveOrdersCsvJobData (
    args,
    uId,
    uInfo
  ) {
    checkParams(args)

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const jobData = {
      userInfo,
      userId,
      name: 'getActiveOrders',
      args,
      propNameForPagination: null,
      columnsCsv: {
        id: '#',
        symbol: 'PAIR',
        type: 'TYPE',
        typePrev: 'PREVIOUS ORDER TYPE',
        amountOrig: 'AMOUNT',
        amountExecuted: 'EXECUTED AMOUNT',
        price: 'PRICE',
        priceAvg: 'AVERAGE EXECUTION PRICE',
        priceTrailing: 'TRAILING PRICE',
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
  }

  async getMovementsCsvJobData (
    args,
    uId,
    uInfo
  ) {
    checkParams(args)

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
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
        destinationAddress: 'DESCRIPTION',
        transactionId: 'TRANSACTION ID'
      },
      formatSettings: {
        mtsUpdated: 'date'
      }
    }

    return jobData
  }

  async getFundingOfferHistoryCsvJobData (
    args,
    uId,
    uInfo
  ) {
    checkParams(args)

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
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
  }

  async getFundingLoanHistoryCsvJobData (
    args,
    uId,
    uInfo
  ) {
    checkParams(args)

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
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
  }

  async getFundingCreditHistoryCsvJobData (
    args,
    uId,
    uInfo
  ) {
    checkParams(args)

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
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

  async getLoginsCsvJobData (
    args,
    uId,
    uInfo
  ) {
    checkParams(args)

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const csvArgs = getCsvArgs(args, 'logins')

    const jobData = {
      userInfo,
      userId,
      name: 'getLogins',
      args: csvArgs,
      propNameForPagination: 'time',
      columnsCsv: {
        id: '#',
        ip: 'IP',
        time: 'DATE'
      },
      formatSettings: {
        time: 'date'
      }
    }

    return jobData
  }

  async getChangeLogsCsvJobData (
    args,
    uId,
    uInfo
  ) {
    checkParams(args)

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const csvArgs = getCsvArgs(args, 'changeLogs')

    const jobData = {
      userInfo,
      userId,
      name: 'getChangeLogs',
      args: csvArgs,
      propNameForPagination: 'mtsCreate',
      columnsCsv: {
        mtsCreate: 'DATE',
        log: 'LOG',
        ip: 'IP',
        userAgent: 'USER AGENT'
      },
      formatSettings: {
        time: 'mtsCreate'
      }
    }

    return jobData
  }

  async getMultipleCsvJobData (
    args,
    uId,
    uInfo
  ) {
    checkParams(args, 'paramsSchemaForMultipleCsv', false, true)

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const { language } = { ...args.params }
    const jobsData = []

    for (const params of args.params.multiExport) {
      const getJobDataMethodName = `${params.method}JobData`

      if (
        getJobDataMethodName === 'getMultipleCsvJobData' ||
        typeof this[getJobDataMethodName] !== 'function' ||
        typeof this.rService[params.method] !== 'function'
      ) {
        throw new FindMethodToGetCsvFileError()
      }

      const jobData = await this[getJobDataMethodName](
        {
          ...args,
          params: {
            ...params,
            language
          }
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
}

decorate(injectable(), CsvJobData)
decorate(inject(TYPES.RService), CsvJobData, 0)

module.exports = CsvJobData
