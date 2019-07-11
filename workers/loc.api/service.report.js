'use strict'

const { Api } = require('bfx-wrk-api')
const { promisify } = require('util')

const {
  checkParams,
  getCsvStoreStatus,
  parseFields,
  accountCache,
  getTimezoneConf,
  prepareApiResponse
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
  _initialize () {
    this.container = this.ctx.grc_bfx.caller.container

    this.container.get(TYPES.InjectDepsToRService)()
  }

  _getUserInfo (args) {
    const rest = this._getREST(args.auth)

    return rest.userInfo()
  }

  _getSymbols () {
    const rest = this._getREST({})

    return rest.symbols()
  }

  _getFutures () {
    const rest = this._getREST({})

    return rest.futures()
  }

  _getCurrencies () {
    const rest = this._getREST({})

    return rest.currencies()
  }

  verifyDigitalSignature (space, args, cb) {
    return this._responder(() => {
      return this._grcBfxReq({
        service: 'rest:ext:gpg',
        action: 'verifyDigitalSignature',
        args: [null, args]
      })
    }, 'verifyDigitalSignature', cb)
  }

  isSyncModeConfig (space, args, cb) {
    console.log('[isSyncModeConfig]'.bgBlue)
    return this._responder(() => {
      return this.container.get(TYPES.CONF).syncMode
    }, 'isSyncModeConfig', cb)
  }

  getEmail (space, args, cb) {
    return this._responder(async () => {
      const { email } = await this._getUserInfo(args)

      return email
    }, 'getEmail', cb)
  }

  login (space, args, cb, isInnerCall) {
    return this._responder(async () => {
      const userInfo = await this._getUserInfo(args)
      const isSyncModeConfig = this.isSyncModeConfig()

      return isInnerCall
        ? { ...userInfo, isSyncModeConfig }
        : userInfo.email
    }, 'login', cb)
  }

  getUsersTimeConf (space, args, cb) {
    return this._responder(async () => {
      const { timezone } = await this._getUserInfo(args)

      return getTimezoneConf(timezone)
    }, 'getUsersTimeConf', cb)
  }

  lookUpFunction (space, args, cb) {
    return this._responder(async () => {
      if (
        !args.params ||
        typeof args.params !== 'object'
      ) {
        throw new ArgsParamsError()
      }

      const { service } = { ...args.params }
      const link = this.ctx.grc_bfx.link
      const lookup = promisify(link.lookup).bind(link)

      try {
        const res = await lookup(service)

        return Array.isArray(res)
          ? res.length
          : 0
      } catch (err) {
        return 0
      }
    }, 'lookUpFunction', cb)
  }

  getSymbols (space, args, cb) {
    return this._responder(async () => {
      const cache = accountCache.get('symbols')

      if (cache) return cache

      const symbols = await this._getSymbols()
      const futures = await this._getFutures()
      const pairs = [ ...symbols, ...futures ]

      const currencies = await this._getCurrencies()
      const res = { pairs, currencies }

      accountCache.set('symbols', res)

      return res
    }, 'getSymbols', cb)
  }

  getTickersHistory (space, args, cb) {
    return this._responder(() => {
      const { symbol: s } = { ...args.params }
      const symbol = s && typeof s === 'string'
        ? [s]
        : s
      const _args = {
        ...args,
        auth: {},
        params: {
          ...args.params,
          symbol
        }
      }

      // TODO: need to move the `prepareApiResponse` to some service
      return prepareApiResponse(
        _args,
        this.ctx.grc_bfx.caller,
        'tickersHistory',
        'mtsUpdate',
        null,
        ['symbol']
      )
    }, 'getTickersHistory', cb)
  }

  getPositionsHistory (space, args, cb) {
    return this._responder(() => {
      return prepareApiResponse(
        args,
        this.ctx.grc_bfx.caller,
        'positionsHistory',
        'mtsUpdate',
        'symbol'
      )
    }, 'getPositionsHistory', cb)
  }

  getActivePositions (space, args, cb) {
    return this._responder(async () => {
      const rest = this._getREST(args.auth)
      const positions = await rest.positions()

      return Array.isArray(positions)
        ? positions.filter(({ status }) => status === 'ACTIVE')
        : []
    }, 'getActivePositions', cb)
  }

  getPositionsAudit (space, args, cb) {
    return this._responder(() => {
      return prepareApiResponse(
        args,
        this.ctx.grc_bfx.caller,
        'positionsAudit',
        'mtsUpdate',
        'symbol'
      )
    }, 'getPositionsAudit', cb)
  }

  getWallets (space, args, cb) {
    return this._responder(async () => {
      checkParams(args, 'paramsSchemaForWallets')

      const rest = this._getREST(args.auth)
      const { end } = { ...args.params }

      return end
        ? rest.walletsHistory(end)
        : rest.wallets()
    }, 'getWallets', cb)
  }

  getLedgers (space, args, cb) {
    return this._responder(() => {
      return prepareApiResponse(
        args,
        this.ctx.grc_bfx.caller,
        'ledgers',
        'mts',
        'currency'
      )
    }, 'getLedgers', cb)
  }

  getTrades (space, args, cb) {
    return this._responder(() => {
      return prepareApiResponse(
        args,
        this.ctx.grc_bfx.caller,
        'trades',
        'mtsCreate',
        'symbol'
      )
    }, 'getTrades', cb)
  }

  getFundingTrades (space, args, cb) {
    return this._responder(() => {
      return prepareApiResponse(
        args,
        this.ctx.grc_bfx.caller,
        'fundingTrades',
        'mtsCreate',
        'symbol'
      )
    }, 'getFundingTrades', cb)
  }

  getPublicTrades (space, args, cb) {
    return this._responder(() => {
      const _args = {
        ...args,
        auth: {}
      }

      return prepareApiResponse(
        _args,
        this.ctx.grc_bfx.caller,
        'publicTrades',
        'mts',
        ['symbol']
      )
    }, 'getPublicTrades', cb)
  }

  getOrderTrades (space, args, cb) {
    return this._responder(() => {
      return prepareApiResponse(
        args,
        this.ctx.grc_bfx.caller,
        'orderTrades',
        'mtsCreate',
        'symbol'
      )
    }, 'getOrderTrades', cb)
  }

  getOrders (space, args, cb) {
    return this._responder(async () => {
      const _res = await prepareApiResponse(
        args,
        this.ctx.grc_bfx.caller,
        'orders',
        'mtsUpdate',
        'symbol'
      )
      const res = parseFields(_res.res, { executed: true })

      return { ..._res, res }
    }, 'getOrders', cb)
  }

  getActiveOrders (space, args, cb) {
    return this._responder(async () => {
      const rest = this._getREST(args.auth)

      const _res = await rest.activeOrders()

      return parseFields(_res, { executed: true })
    }, 'getActiveOrders', cb)
  }

  getMovements (space, args, cb) {
    return this._responder(() => {
      return prepareApiResponse(
        args,
        this.ctx.grc_bfx.caller,
        'movements',
        'mtsUpdated',
        'currency'
      )
    }, 'getMovements', cb)
  }

  getFundingOfferHistory (space, args, cb) {
    return this._responder(async () => {
      const _res = await prepareApiResponse(
        args,
        this.ctx.grc_bfx.caller,
        'fundingOfferHistory',
        'mtsUpdate',
        'symbol'
      )
      const res = parseFields(_res.res, { executed: true, rate: true })

      return { ..._res, res }
    }, 'getFundingOfferHistory', cb)
  }

  getFundingLoanHistory (space, args, cb) {
    return this._responder(async () => {
      const _res = await prepareApiResponse(
        args,
        this.ctx.grc_bfx.caller,
        'fundingLoanHistory',
        'mtsUpdate',
        'symbol'
      )
      const res = parseFields(_res.res, { rate: true })

      return { ..._res, res }
    }, 'getFundingLoanHistory', cb)
  }

  getFundingCreditHistory (space, args, cb) {
    return this._responder(async () => {
      const _res = await prepareApiResponse(
        args,
        this.ctx.grc_bfx.caller,
        'fundingCreditHistory',
        'mtsUpdate',
        'symbol'
      )
      const res = parseFields(_res.res, { rate: true })

      return { ..._res, res }
    }, 'getFundingCreditHistory', cb)
  }

  getMultipleCsv (space, args, cb) {
    return this._responder(async () => {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getMultipleCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      return status
    }, 'getMultipleCsv', cb)
  }

  getTradesCsv (space, args, cb) {
    return this._responder(async () => {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getTradesCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      return status
    }, 'getTradesCsv', cb)
  }

  getFundingTradesCsv (space, args, cb) {
    return this._responder(async () => {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getFundingTradesCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      return status
    }, 'getFundingTradesCsv', cb)
  }

  getTickersHistoryCsv (space, args, cb) {
    return this._responder(async () => {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getTickersHistoryCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      return status
    }, 'getTickersHistoryCsv', cb)
  }

  getWalletsCsv (space, args, cb) {
    return this._responder(async () => {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getWalletsCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      return status
    }, 'getWalletsCsv', cb)
  }

  getPositionsHistoryCsv (space, args, cb) {
    return this._responder(async () => {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getPositionsHistoryCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      return status
    }, 'getPositionsHistoryCsv', cb)
  }

  getActivePositionsCsv (space, args, cb) {
    return this._responder(async () => {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getActivePositionsCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      return status
    }, 'getActivePositionsCsv', cb)
  }

  getPositionsAuditCsv (space, args, cb) {
    return this._responder(async () => {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getPositionsAuditCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      return status
    }, 'getPositionsAuditCsv', cb)
  }

  getPublicTradesCsv (space, args, cb) {
    return this._responder(async () => {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getPublicTradesCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      return status
    }, 'getPublicTradesCsv', cb)
  }

  getLedgersCsv (space, args, cb) {
    return this._responder(async () => {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getLedgersCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      return status
    }, 'getLedgersCsv', cb)
  }

  getOrderTradesCsv (space, args, cb) {
    return this._responder(async () => {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getOrderTradesCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      return status
    }, 'getOrderTradesCsv', cb)
  }

  getOrdersCsv (space, args, cb) {
    return this._responder(async () => {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getOrdersCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      return status
    }, 'getOrdersCsv', cb)
  }

  getActiveOrdersCsv (space, args, cb) {
    return this._responder(async () => {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getActiveOrdersCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      return status
    }, 'getActiveOrdersCsv', cb)
  }

  getMovementsCsv (space, args, cb) {
    return this._responder(async () => {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getMovementsCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      return status
    }, 'getMovementsCsv', cb)
  }

  getFundingOfferHistoryCsv (space, args, cb) {
    return this._responder(async () => {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getFundingOfferHistoryCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      return status
    }, 'getFundingOfferHistoryCsv', cb)
  }

  getFundingLoanHistoryCsv (space, args, cb) {
    return this._responder(async () => {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getFundingLoanHistoryCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      return status
    }, 'getFundingLoanHistoryCsv', cb)
  }

  getFundingCreditHistoryCsv (space, args, cb) {
    return this._responder(async () => {
      const status = await getCsvStoreStatus(this, args)
      const jobData = await getFundingCreditHistoryCsvJobData(this, args)
      const processorQueue = this.ctx.lokue_processor.q

      processorQueue.addJob(jobData)

      return status
    }, 'getFundingCreditHistoryCsv', cb)
  }
}

module.exports = ReportService
