'use strict'

const { Api } = require('bfx-wrk-api')

const {
  getREST,
  checkParams,
  getCsvStoreStatus,
  toString,
  parseFields,
  accountCache,
  getTimezoneConf,
  prepareApiResponse,
  grcBfxReq
} = require('./helpers')
const {
  getTradesCsvJobData,
  getFundingTradesCsvJobData,
  getTickersHistoryCsvJobData,
  getWalletsCsvJobData,
  getPositionsHistoryCsvJobData,
  getActivePositionsCsvJobData,
  getPositionsAuditCsvJobData,
  getPublicTradesCsvJobData,
  getLedgersCsvJobData,
  getOrdersCsvJobData,
  getActiveOrdersCsvJobData,
  getMovementsCsvJobData,
  getFundingOfferHistoryCsvJobData,
  getFundingLoanHistoryCsvJobData,
  getFundingCreditHistoryCsvJobData,
  getOrderTradesCsvJobData,
  getMultipleCsvJobData
} = require('./helpers/get-csv-job-data')
const { ArgsParamsError } = require('./errors')
const TYPES = require('./di/types')

class ReportService extends Api {
  _grcBfxReq (query = {}) {
    return grcBfxReq(this, query)
  }

  async verifyDigitalSignature (space, args, cb) {
    return this.responder(() => {
      return this._grcBfxReq({
        service: 'rest:ext:gpg',
        action: 'verifyDigitalSignature',
        args: [null, args]
      })
    }, 'verifyDigitalSignature', cb)
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

  async getEmail (space, args, cb) {
    try {
      const result = await this._getUserInfo(args)

      cb(null, result.email)
    } catch (err) {
      this._err(err, 'getEmail', cb)
    }
  }

  async login (space, args, cb, isInnerCall) {
    try {
      const userInfo = await this._getUserInfo(args)
      const isSyncModeConfig = this.isSyncModeConfig()

      const res = isInnerCall
        ? { ...userInfo, isSyncModeConfig }
        : userInfo.email

      if (!cb) return res
      cb(null, res)
    } catch (err) {
      this._err(err, 'login', cb)
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
        throw new ArgsParamsError()
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

      const symbols = await this._getSymbols()
      const futures = await this._getFutures()
      const pairs = [ ...symbols, ...futures ]

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

  _getFutures () {
    const rest = getREST({}, this.ctx.grc_bfx.caller)

    return rest.futures()
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

  async getActivePositions (space, args, cb) {
    try {
      const rest = getREST(args.auth, this.ctx.grc_bfx.caller)
      const positions = await rest.positions()
      const res = Array.isArray(positions)
        ? positions.filter(({ status }) => status === 'ACTIVE')
        : []

      cb(null, res)
    } catch (err) {
      this._err(err, 'getActivePositions', cb)
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

      if (!cb) return res
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

      const res = (end)
        ? await rest.walletsHistory(end)
        : await rest.wallets()

      if (!cb) return res
      cb(null, res)
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

  async getFundingTrades (space, args, cb) {
    try {
      const res = await prepareApiResponse(
        args,
        this.ctx.grc_bfx.caller,
        'fundingTrades',
        'mtsCreate',
        'symbol'
      )

      cb(null, res)
    } catch (err) {
      this._err(err, 'getFundingTrades', cb)
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

  async getOrderTrades (space, args, cb) {
    try {
      const res = await prepareApiResponse(
        args,
        this.ctx.grc_bfx.caller,
        'orderTrades',
        'mtsCreate',
        'symbol'
      )

      cb(null, res)
    } catch (err) {
      this._err(err, 'getOrderTrades', cb)
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

  async getActiveOrders (space, args, cb) {
    try {
      const rest = getREST(args.auth, this.ctx.grc_bfx.caller)

      const _res = await rest.activeOrders()
      const res = parseFields(_res, { executed: true })

      cb(null, res)
    } catch (err) {
      this._err(err, 'getActiveOrders', cb)
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
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getMultipleCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getMultipleCsv', cb)
    }
  }

  async getTradesCsv (space, args, cb) {
    try {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getTradesCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getTradesCsv', cb)
    }
  }

  async getFundingTradesCsv (space, args, cb) {
    try {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getFundingTradesCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getFundingTradesCsv', cb)
    }
  }

  async getTickersHistoryCsv (space, args, cb) {
    try {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getTickersHistoryCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getTickersHistoryCsv', cb)
    }
  }

  async getWalletsCsv (space, args, cb) {
    try {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getWalletsCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getWalletsCsv', cb)
    }
  }

  async getPositionsHistoryCsv (space, args, cb) {
    try {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getPositionsHistoryCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getPositionsHistoryCsv', cb)
    }
  }

  async getActivePositionsCsv (space, args, cb) {
    try {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getActivePositionsCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getActivePositionsCsv', cb)
    }
  }

  async getPositionsAuditCsv (space, args, cb) {
    try {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getPositionsAuditCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getPositionsAuditCsv', cb)
    }
  }

  async getPublicTradesCsv (space, args, cb) {
    try {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getPublicTradesCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getPublicTradesCsv', cb)
    }
  }

  async getLedgersCsv (space, args, cb) {
    try {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getLedgersCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getLedgersCsv', cb)
    }
  }

  async getOrderTradesCsv (space, args, cb) {
    try {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getOrderTradesCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getOrderTradesCsv', cb)
    }
  }

  async getOrdersCsv (space, args, cb) {
    try {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getOrdersCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getOrdersCsv', cb)
    }
  }

  async getActiveOrdersCsv (space, args, cb) {
    try {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getActiveOrdersCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getActiveOrdersCsv', cb)
    }
  }

  async getMovementsCsv (space, args, cb) {
    try {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getMovementsCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getMovementsCsv', cb)
    }
  }

  async getFundingOfferHistoryCsv (space, args, cb) {
    try {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getFundingOfferHistoryCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getFundingOfferHistoryCsv', cb)
    }
  }

  async getFundingLoanHistoryCsv (space, args, cb) {
    try {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getFundingLoanHistoryCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getFundingLoanHistoryCsv', cb)
    }
  }

  async getFundingCreditHistoryCsv (space, args, cb) {
    try {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getFundingCreditHistoryCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

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

  _initialize () {
    this.container = this.ctx.grc_bfx.caller.container
    this.responder = this.container.get(TYPES.Responder)
  }
}

module.exports = ReportService
