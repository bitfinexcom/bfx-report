'use strict'

const { Api } = require('bfx-wrk-api')

const {
  getREST,
  checkParams,
  getCsvStoreStatus,
  hasJobInQueueWithStatusBy,
  toString,
  parseFields,
  accountCache,
  getTimezoneConf,
  prepareApiResponse,
  getCsvArgs
} = require('./helpers')
const {
  getTradesCsvJobData,
  getTickersHistoryCsvJobData,
  getWalletsCsvJobData,
  getPositionsHistoryCsvJobData,
  getPositionsAuditCsvJobData,
  getPublicTradesCsvJobData,
  getLedgersCsvJobData,
  getOrdersCsvJobData,
  getMultipleCsvJobData
} = require('./helpers/getCsvJobData')

class ReportService extends Api {
  space (service, msg) {
    const space = super.space(service, msg)
    return space
  }

  isSyncModeConfig (space, args, cb = () => { }) {
    const wrk = this.ctx.grc_bfx.caller
    const group = wrk.group
    const conf = wrk.conf[group]

    cb(null, conf.syncMode)

    return conf.syncMode
  }

  _getUserInfo (args) {
    const rest = getREST(args.auth, this.ctx.grc_bfx.caller)

    return rest.userInfo()
  }

  async _getUsername (args) {
    try {
      const { username } = await this._getUserInfo(args)

      if (!username || typeof username !== 'string') {
        return false
      }

      return username
    } catch (err) {
      return false
    }
  }

  async getEmail (space, args, cb) {
    try {
      const result = await this._getUserInfo(args)

      cb(null, result.email)
    } catch (err) {
      this._err(err, 'getEmail', cb)
    }
  }

  async getUsersTimeConf (space, args, cb) {
    try {
      const { timezone } = await this._getUserInfo(args)
      const result = getTimezoneConf(timezone)

      cb(null, result)
    } catch (err) {
      this._err(err, 'getUsersTimeConf', cb)
    }
  }

  lookUpFunction (space, args, cb) {
    try {
      if (typeof args.params !== 'object') {
        throw new Error('ERR_ARGS_NO_PARAMS')
      }

      const { service } = args.params
      const grape = this.ctx.grc_bfx

      grape.link.lookup(service, (err, res) => {
        const amount = (!err) ? res.length : 0

        cb(null, amount)
      })
    } catch (err) {
      this._err(err, 'lookUpFunction', cb)
    }
  }

  async getSymbols (space, args, cb) {
    try {
      const cache = accountCache.get('symbols')

      if (cache) return cb(null, cache)

      const pairs = await this._getSymbols()
      const currencies = await this._getCurrencies()
      const result = { pairs, currencies }
      accountCache.set('symbols', result)

      cb(null, result)
    } catch (err) {
      this._err(err, 'getSymbols', cb)
    }
  }

  _getSymbols () {
    const rest = getREST({}, this.ctx.grc_bfx.caller)

    return rest.symbols()
  }

  _getCurrencies () {
    const rest = getREST({}, this.ctx.grc_bfx.caller)

    return rest.currencies()
  }

  async getTickersHistory (space, args, cb) {
    try {
      if (
        args &&
        typeof args === 'object' &&
        args.params &&
        typeof args.params === 'object' &&
        args.params.symbol &&
        typeof args.params.symbol === 'string'
      ) {
        args.params.symbol = [args.params.symbol]
      }

      args.auth = {}

      const res = await prepareApiResponse(
        args,
        this.ctx.grc_bfx.caller,
        'tickersHistory',
        'mtsUpdate',
        null,
        ['symbol']
      )

      cb(null, res)
    } catch (err) {
      this._err(err, 'getTickersHistory', cb)
    }
  }

  async getPositionsHistory (space, args, cb) {
    try {
      const res = await prepareApiResponse(
        args,
        this.ctx.grc_bfx.caller,
        'positionsHistory',
        'mtsUpdate',
        'symbol'
      )

      cb(null, res)
    } catch (err) {
      this._err(err, 'getPositionsHistory', cb)
    }
  }

  async getPositionsAudit (space, args, cb) {
    try {
      const res = await prepareApiResponse(
        args,
        this.ctx.grc_bfx.caller,
        'positionsAudit',
        'mtsUpdate',
        'symbol'
      )

      cb(null, res)
    } catch (err) {
      this._err(err, 'getPositionsAudit', cb)
    }
  }

  async getWallets (space, args, cb) {
    try {
      checkParams(args, 'paramsSchemaForWallets')

      const rest = getREST(args.auth, this.ctx.grc_bfx.caller)
      const end = args.params && args.params.end

      const result = (end)
        ? await rest.walletsHistory(end)
        : await rest.wallets()

      cb(null, result)
    } catch (err) {
      this._err(err, 'getWallet', cb)
    }
  }

  async getLedgers (space, args, cb) {
    try {
      const res = await prepareApiResponse(
        args,
        this.ctx.grc_bfx.caller,
        'ledgers',
        'mts',
        'currency'
      )

      cb(null, res)
    } catch (err) {
      this._err(err, 'getLedgers', cb)
    }
  }

  async getTrades (space, args, cb) {
    try {
      const res = await prepareApiResponse(
        args,
        this.ctx.grc_bfx.caller,
        'trades',
        'mtsCreate',
        'symbol'
      )

      cb(null, res)
    } catch (err) {
      this._err(err, 'getTrades', cb)
    }
  }

  async getPublicTrades (space, args, cb) {
    try {
      args.auth = {}

      const res = await prepareApiResponse(
        args,
        this.ctx.grc_bfx.caller,
        'publicTrades',
        'mts',
        ['symbol']
      )

      cb(null, res)
    } catch (err) {
      this._err(err, 'getPublicTrades', cb)
    }
  }

  async getOrders (space, args, cb) {
    try {
      const res = await prepareApiResponse(
        args,
        this.ctx.grc_bfx.caller,
        'orders',
        'mtsUpdate',
        'symbol'
      )
      res.res = parseFields(res.res, { executed: true })

      cb(null, res)
    } catch (err) {
      this._err(err, 'getOrders', cb)
    }
  }

  async getMovements (space, args, cb) {
    try {
      const res = await prepareApiResponse(
        args,
        this.ctx.grc_bfx.caller,
        'movements',
        'mtsUpdated',
        'currency'
      )

      cb(null, res)
    } catch (err) {
      this._err(err, 'getMovements', cb)
    }
  }

  async getFundingOfferHistory (space, args, cb) {
    try {
      const res = await prepareApiResponse(
        args,
        this.ctx.grc_bfx.caller,
        'fundingOfferHistory',
        'mtsUpdate',
        'symbol'
      )
      res.res = parseFields(res.res, { executed: true, rate: true })

      cb(null, res)
    } catch (err) {
      this._err(err, 'getFundingOfferHistory', cb)
    }
  }

  async getFundingLoanHistory (space, args, cb) {
    try {
      const res = await prepareApiResponse(
        args,
        this.ctx.grc_bfx.caller,
        'fundingLoanHistory',
        'mtsUpdate',
        'symbol'
      )
      res.res = parseFields(res.res, { rate: true })

      cb(null, res)
    } catch (err) {
      this._err(err, 'getFundingLoanHistory', cb)
    }
  }

  async getFundingCreditHistory (space, args, cb) {
    try {
      const res = await prepareApiResponse(
        args,
        this.ctx.grc_bfx.caller,
        'fundingCreditHistory',
        'mtsUpdate',
        'symbol'
      )
      res.res = parseFields(res.res, { rate: true })

      cb(null, res)
    } catch (err) {
      this._err(err, 'getFundingCreditHistory', cb)
    }
  }

  async getMultipleCsv (space, args, cb) {
    try {
      const userId = await hasJobInQueueWithStatusBy(this, args)
      const status = await getCsvStoreStatus(this, args)
      const userInfo = await this._getUsername(args)
      const jobData = getMultipleCsvJobData(this, args, userId, userInfo)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getMultipleCsv', cb)
    }
  }

  async getTradesCsv (space, args, cb) {
    try {
      const userId = await hasJobInQueueWithStatusBy(this, args)
      const status = await getCsvStoreStatus(this, args)
      const userInfo = await this._getUsername(args)
      const jobData = getTradesCsvJobData(args, userId, userInfo)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getTradesCsv', cb)
    }
  }

  async getTickersHistoryCsv (space, args, cb) {
    try {
      const userId = await hasJobInQueueWithStatusBy(this, args)
      const status = await getCsvStoreStatus(this, args)
      const userInfo = await this._getUsername(args)
      const jobData = getTickersHistoryCsvJobData(args, userId, userInfo)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getTickersHistoryCsv', cb)
    }
  }

  async getWalletsCsv (space, args, cb) {
    try {
      const userId = await hasJobInQueueWithStatusBy(this, args)
      const status = await getCsvStoreStatus(this, args)
      const userInfo = await this._getUsername(args)
      const jobData = getWalletsCsvJobData(args, userId, userInfo)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getWalletsCsv', cb)
    }
  }

  async getPositionsHistoryCsv (space, args, cb) {
    try {
      const userId = await hasJobInQueueWithStatusBy(this, args)
      const status = await getCsvStoreStatus(this, args)
      const userInfo = await this._getUsername(args)
      const jobData = getPositionsHistoryCsvJobData(args, userId, userInfo)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getPositionsHistoryCsv', cb)
    }
  }

  async getPositionsAuditCsv (space, args, cb) {
    try {
      const userId = await hasJobInQueueWithStatusBy(this, args)
      const status = await getCsvStoreStatus(this, args)
      const userInfo = await this._getUsername(args)
      const jobData = getPositionsAuditCsvJobData(args, userId, userInfo)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getPositionsAuditCsv', cb)
    }
  }

  async getPublicTradesCsv (space, args, cb) {
    try {
      const userId = await hasJobInQueueWithStatusBy(this, args)
      const status = await getCsvStoreStatus(this, args)
      const userInfo = await this._getUsername(args)
      const jobData = getPublicTradesCsvJobData(args, userId, userInfo)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getPublicTradesCsv', cb)
    }
  }

  async getLedgersCsv (space, args, cb) {
    try {
      const userId = await hasJobInQueueWithStatusBy(this, args)
      const status = await getCsvStoreStatus(this, args)
      const userInfo = await this._getUsername(args)
      const jobData = getLedgersCsvJobData(args, userId, userInfo)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getLedgersCsv', cb)
    }
  }

  async getOrdersCsv (space, args, cb) {
    try {
      const userId = await hasJobInQueueWithStatusBy(this, args)
      const status = await getCsvStoreStatus(this, args)
      const userInfo = await this._getUsername(args)
      const jobData = getOrdersCsvJobData(args, userId, userInfo)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getOrdersCsv', cb)
    }
  }

  async getMovementsCsv (space, args, cb) {
    try {
      checkParams(args)
      const userId = await hasJobInQueueWithStatusBy(this, args)
      const status = await getCsvStoreStatus(this, args)
      const userInfo = await this._getUsername(args)

      const csvArgs = getCsvArgs(args, 'movements')
      const processorQueue = this.ctx.lokue_processor.q
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

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getMovementsCsv', cb)
    }
  }

  async getFundingOfferHistoryCsv (space, args, cb) {
    try {
      checkParams(args)
      const userId = await hasJobInQueueWithStatusBy(this, args)
      const status = await getCsvStoreStatus(this, args)
      const userInfo = await this._getUsername(args)

      const csvArgs = getCsvArgs(args, 'fundingOfferHistory')
      const processorQueue = this.ctx.lokue_processor.q
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

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getFundingOfferHistoryCsv', cb)
    }
  }

  async getFundingLoanHistoryCsv (space, args, cb) {
    try {
      checkParams(args)
      const userId = await hasJobInQueueWithStatusBy(this, args)
      const status = await getCsvStoreStatus(this, args)
      const userInfo = await this._getUsername(args)

      const csvArgs = getCsvArgs(args, 'fundingLoanHistory')
      const processorQueue = this.ctx.lokue_processor.q
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

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getFundingLoanHistoryCsv', cb)
    }
  }

  async getFundingCreditHistoryCsv (space, args, cb) {
    try {
      checkParams(args)
      const userId = await hasJobInQueueWithStatusBy(this, args)
      const status = await getCsvStoreStatus(this, args)
      const userInfo = await this._getUsername(args)

      const csvArgs = getCsvArgs(args, 'fundingCreditHistory')
      const processorQueue = this.ctx.lokue_processor.q
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

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getFundingCreditHistoryCsv', cb)
    }
  }

  _err (err, caller, cb) {
    const options = toString(err.options)
    const logTxtErr = `
    function: ${caller}
    statusCode: ${err.statusCode}
    name: ${err.name}
    message: ${err.message}
    options: ${options}

    `
    const logger = this.ctx.grc_bfx.caller.logger
    logger.error(logTxtErr)

    if (cb) cb(err)
    else throw err
  }
}

module.exports = ReportService
