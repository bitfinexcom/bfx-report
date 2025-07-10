'use strict'

const { omit } = require('lib-js-util-base')

const { decorateInjectable } = require('../di/utils')

const {
  checkParams,
  getReportFileArgs,
  checkTimeLimit,
  checkJobAndGetUserData,
  parsePositionsAuditId
} = require('../helpers')
const {
  FindMethodToGetReportFileError,
  SymbolsTypeError
} = require('../errors')

const depsTypes = (TYPES) => [
  TYPES.RService,
  TYPES.DataValidator,
  TYPES.WeightedAveragesReportCsvWriter
]
class ReportFileJobData {
  constructor (
    rService,
    dataValidator,
    weightedAveragesReportCsvWriter
  ) {
    this.rService = rService
    this.dataValidator = dataValidator
    this.weightedAveragesReportCsvWriter = weightedAveragesReportCsvWriter
  }

  async getTradesFileJobData (
    args,
    uId,
    uInfo
  ) {
    this.dataValidator.validate(
      args,
      this.dataValidator.SCHEMA_IDS.COMMON_FILE_REQ
    )

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const reportFileArgs = getReportFileArgs(args, 'trades')

    const jobData = {
      userInfo,
      userId,
      name: 'getTrades',
      args: reportFileArgs,
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

  async getFundingTradesFileJobData (
    args,
    uId,
    uInfo
  ) {
    this.dataValidator.validate(
      args,
      this.dataValidator.SCHEMA_IDS.COMMON_FILE_REQ
    )

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const reportFileArgs = getReportFileArgs(args, 'fundingTrades')

    const jobData = {
      userInfo,
      userId,
      name: 'getFundingTrades',
      args: reportFileArgs,
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

  async getTickersHistoryFileJobData (
    args,
    uId,
    uInfo
  ) {
    this.dataValidator.validate(
      args,
      this.dataValidator.SCHEMA_IDS.GET_TICKERS_HISTORY_FILE_REQ
    )

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const reportFileArgs = getReportFileArgs(args, 'tickersHistory')
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
      args: reportFileArgs,
      propNameForPagination: 'mtsUpdate',
      columnsCsv: isTrading ? tTickerHistColumns : fTickerHistColumns,
      formatSettings: {
        mtsUpdate: 'date',
        symbol: 'symbol'
      }
    }

    return jobData
  }

  async getWalletsFileJobData (
    args,
    uId,
    uInfo
  ) {
    this.dataValidator.validate(
      args,
      this.dataValidator.SCHEMA_IDS.GET_WALLETS_FILE_REQ
    )

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
      args: {
        ...args,
        params: {
          ...args?.params,
          isBaseNameInName: true
        }
      },
      propNameForPagination: 'mtsUpdate',
      columnsCsv: {
        type: 'TYPE',
        currency: 'CURRENCY',
        balance: 'BALANCE'
      }
    }

    return jobData
  }

  async getPositionsHistoryFileJobData (
    args,
    uId,
    uInfo
  ) {
    this.dataValidator.validate(
      args,
      this.dataValidator.SCHEMA_IDS.COMMON_FILE_REQ
    )

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const reportFileArgs = getReportFileArgs(args, 'positionsHistory')

    const jobData = {
      userInfo,
      userId,
      name: 'getPositionsHistory',
      args: reportFileArgs,
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

  async getActivePositionsFileJobData (
    args,
    uId,
    uInfo
  ) {
    this.dataValidator.validate(
      args,
      this.dataValidator.SCHEMA_IDS.GET_ACTIVE_POSITIONS_FILE_REQ
    )

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

  async getPositionsAuditFileJobData (
    args,
    uId,
    uInfo
  ) {
    const _args = parsePositionsAuditId(args)
    checkParams(_args, 'paramsSchemaForPositionsAuditFile', ['id'])

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const reportFileArgs = getReportFileArgs(_args, 'positionsAudit')

    const jobData = {
      userInfo,
      userId,
      name: 'getPositionsAudit',
      args: reportFileArgs,
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

  async getPublicTradesFileJobData (
    args,
    uId,
    uInfo
  ) {
    checkParams(args, 'paramsSchemaForPublicTradesFile', ['symbol'])
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
    const reportFileArgs = getReportFileArgs(args, 'publicTrades', { isTradingPair })
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
      args: reportFileArgs,
      propNameForPagination: 'mts',
      columnsCsv,
      formatSettings: {
        mts: 'date',
        symbol: 'symbol'
      }
    }

    return jobData
  }

  async getStatusMessagesFileJobData (
    args,
    uId,
    uInfo
  ) {
    checkParams(args, 'paramsSchemaForStatusMessagesFile')

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

  async getCandlesFileJobData (
    args,
    uId,
    uInfo
  ) {
    checkParams(args, 'paramsSchemaForCandlesFile', ['symbol'])
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

  async getLedgersFileJobData (
    args,
    uId,
    uInfo
  ) {
    this.dataValidator.validate(
      args,
      this.dataValidator.SCHEMA_IDS.GET_LEDGERS_FILE_REQ
    )

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const reportFileArgs = getReportFileArgs(args, 'ledgers')

    const jobData = {
      userInfo,
      userId,
      name: 'getLedgers',
      args: reportFileArgs,
      propNameForPagination: 'mts',
      /*
       * Example how to overwrite column order for pdf
       * columnsPdf: {},
       */
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

  async getPayInvoiceListFileJobData (
    args,
    uId,
    uInfo
  ) {
    this.dataValidator.validate(
      args,
      this.dataValidator.SCHEMA_IDS.COMMON_FILE_REQ
    )

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const reportFileArgs = getReportFileArgs(args, 'payInvoiceList')

    const jobData = {
      userInfo,
      userId,
      name: 'getPayInvoiceList',
      args: reportFileArgs,
      propNameForPagination: 't',
      columnsCsv: {
        id: '#',
        t: 'DATE',
        duration: 'DURATION',
        amount: 'AMOUNT',
        currency: 'CURRENCY',
        orderId: 'ORDER ID',
        payCurrencies: 'PAY CURRENCIES',
        status: 'STATUS',
        merchantName: 'MERCHANT NAME'
      },
      formatSettings: {
        t: 'date'
      }
    }

    return jobData
  }

  async getOrderTradesFileJobData (
    args,
    uId,
    uInfo
  ) {
    checkParams(args, 'paramsSchemaForOrderTradesFile')

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const reportFileArgs = getReportFileArgs(args, 'orderTrades')

    const jobData = {
      userInfo,
      userId,
      name: 'getOrderTrades',
      args: reportFileArgs,
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

  async getOrdersFileJobData (
    args,
    uId,
    uInfo
  ) {
    this.dataValidator.validate(
      args,
      this.dataValidator.SCHEMA_IDS.COMMON_FILE_REQ
    )

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const reportFileArgs = getReportFileArgs(args, 'orders')

    const jobData = {
      userInfo,
      userId,
      name: 'getOrders',
      args: reportFileArgs,
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
        status: 'STATUS',
        meta: 'METADATA'
      },
      formatSettings: {
        mtsUpdate: 'date',
        mtsCreate: 'date',
        symbol: 'symbol'
      }
    }

    return jobData
  }

  async getActiveOrdersFileJobData (
    args,
    uId,
    uInfo
  ) {
    this.dataValidator.validate(
      args,
      this.dataValidator.SCHEMA_IDS.COMMON_FILE_REQ
    )

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

  async getMovementsFileJobData (
    args,
    uId,
    uInfo
  ) {
    this.dataValidator.validate(
      args,
      this.dataValidator.SCHEMA_IDS.GET_MOVEMENTS_FILE_REQ
    )

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const reportFileArgs = getReportFileArgs(args, 'movements')

    const jobData = {
      userInfo,
      userId,
      name: 'getMovements',
      args: reportFileArgs,
      propNameForPagination: 'mtsUpdated',
      columnsCsv: {
        id: '#',
        mtsUpdated: 'DATE',
        currency: 'CURRENCY',
        status: 'STATUS',
        amount: 'AMOUNT',
        fees: 'FEES',
        destinationAddress: 'DESCRIPTION',
        transactionId: 'TRANSACTION ID',
        note: 'NOTE'
      },
      formatSettings: {
        mtsUpdated: 'date'
      }
    }

    return jobData
  }

  async getFundingOfferHistoryFileJobData (
    args,
    uId,
    uInfo
  ) {
    this.dataValidator.validate(
      args,
      this.dataValidator.SCHEMA_IDS.COMMON_FILE_REQ
    )

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const reportFileArgs = getReportFileArgs(args, 'fundingOfferHistory')

    const jobData = {
      userInfo,
      userId,
      name: 'getFundingOfferHistory',
      args: reportFileArgs,
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

  async getFundingLoanHistoryFileJobData (
    args,
    uId,
    uInfo
  ) {
    this.dataValidator.validate(
      args,
      this.dataValidator.SCHEMA_IDS.COMMON_FILE_REQ
    )

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const reportFileArgs = getReportFileArgs(args, 'fundingLoanHistory')

    const jobData = {
      userInfo,
      userId,
      name: 'getFundingLoanHistory',
      args: reportFileArgs,
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

  async getFundingCreditHistoryFileJobData (
    args,
    uId,
    uInfo
  ) {
    this.dataValidator.validate(
      args,
      this.dataValidator.SCHEMA_IDS.COMMON_FILE_REQ
    )

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const reportFileArgs = getReportFileArgs(args, 'fundingCreditHistory')

    const jobData = {
      userInfo,
      userId,
      name: 'getFundingCreditHistory',
      args: reportFileArgs,
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

  async getLoginsFileJobData (
    args,
    uId,
    uInfo
  ) {
    this.dataValidator.validate(
      args,
      this.dataValidator.SCHEMA_IDS.COMMON_FILE_REQ
    )

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const reportFileArgs = getReportFileArgs(args, 'logins')

    const jobData = {
      userInfo,
      userId,
      name: 'getLogins',
      args: reportFileArgs,
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

  async getChangeLogsFileJobData (
    args,
    uId,
    uInfo
  ) {
    this.dataValidator.validate(
      args,
      this.dataValidator.SCHEMA_IDS.COMMON_FILE_REQ
    )

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const reportFileArgs = getReportFileArgs(args, 'changeLogs')

    const jobData = {
      userInfo,
      userId,
      name: 'getChangeLogs',
      args: reportFileArgs,
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

  async getMultipleFileJobData (
    args,
    uId,
    uInfo
  ) {
    this.dataValidator.validate(
      args,
      this.dataValidator.SCHEMA_IDS.GET_MULTIPLE_FILE_REQ,
      { shouldParamsFieldBeChecked: true }
    )

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const {
      language,
      isPDFRequired
    } = args?.params ?? {}
    const jobsData = []

    for (const params of args.params.multiExport) {
      // Handle `csv` string for back compatibility
      const methodName = params?.method.replace(/csv$/i, 'File')
      const getJobDataMethodName = `${methodName}JobData`

      if (
        getJobDataMethodName === 'getMultipleFileJobData' ||
        typeof this[getJobDataMethodName] !== 'function' ||
        typeof this.rService[methodName] !== 'function'
      ) {
        throw new FindMethodToGetReportFileError()
      }

      const jobData = await this[getJobDataMethodName](
        {
          ...args,
          params: {
            ...omit(params, ['method']),
            ...(language && typeof language === 'string'
              ? { language }
              : {}),
            ...(typeof isPDFRequired === 'boolean'
              ? { isPDFRequired }
              : {})
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

  async getWeightedAveragesReportFileJobData (
    args,
    uId,
    uInfo
  ) {
    checkParams(args, 'paramsSchemaForWeightedAveragesReportFile', ['symbol'])

    const {
      userId,
      userInfo
    } = await checkJobAndGetUserData(
      this.rService,
      uId,
      uInfo
    )

    const reportFileArgs = getReportFileArgs(args, 'getWeightedAverages')

    const jobData = {
      userInfo,
      userId,
      name: 'getWeightedAveragesReport',
      fileNamesMap: [['getWeightedAveragesReport', 'weighted-averages-report']],
      args: reportFileArgs,
      columnsCsv: {
        symbol: 'PAIR',
        buyingWeightedPrice: 'WEIGHTED PRICE',
        buyingAmount: 'AMOUNT',
        cost: 'COST',
        sellingWeightedPrice: 'WEIGHTED PRICE',
        sellingAmount: 'AMOUNT',
        sale: 'SALE',
        cumulativeAmount: 'AMOUNT',
        firstTradeMts: 'First Trade',
        lastTradeMts: 'Last Trade'
      },
      formatSettings: {
        symbol: 'symbol',
        firstTradeMts: 'date',
        lastTradeMts: 'date'
      },
      csvCustomWriter: this.weightedAveragesReportCsvWriter
    }

    return jobData
  }
}

decorateInjectable(ReportFileJobData, depsTypes)

module.exports = ReportFileJobData
