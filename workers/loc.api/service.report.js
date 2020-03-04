'use strict'

const { Api } = require('bfx-wrk-api')

const {
  checkParams,
  parseFields,
  parseLoginsExtraDataFields,
  accountCache,
  getTimezoneConf,
  filterModels,
  parsePositionsAuditId
} = require('./helpers')
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

  getFilterModels (space, args, cb) {
    return this._responder(() => {
      const models = [...filterModels]
        .reduce((accum, [key, val]) => {
          return {
            ...accum,
            [key]: val
          }
        }, {})

      return models
    }, 'getFilterModels', cb)
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
    return this._responder(() => {
      if (
        !args.params ||
        typeof args.params !== 'object'
      ) {
        throw new ArgsParamsError()
      }

      const { service } = { ...args.params }

      return this._hasGrcService.lookUpFunction(service)
    }, 'lookUpFunction', cb)
  }

  getSymbols (space, args, cb) {
    return this._responder(async () => {
      const cache = accountCache.get('symbols')

      if (cache) return cache

      const symbols = await this._getSymbols()
      const futures = await this._getFutures()
      const pairs = [...symbols, ...futures]

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

      return this._prepareApiResponse(
        _args,
        'tickersHistory',
        {
          datePropName: 'mtsUpdate',
          requireFields: ['symbol']
        }
      )
    }, 'getTickersHistory', cb)
  }

  getPositionsHistory (space, args, cb) {
    return this._responder(() => {
      return this._prepareApiResponse(
        args,
        'positionsHistory',
        {
          datePropName: 'mtsUpdate',
          symbPropName: 'symbol'
        }
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
      const _args = parsePositionsAuditId(args)

      return this._prepareApiResponse(
        _args,
        'positionsAudit',
        {
          datePropName: 'mtsUpdate',
          symbPropName: 'symbol'
        }
      )
    }, 'getPositionsAudit', cb)
  }

  getWallets (space, args, cb) {
    return this._responder(async () => {
      checkParams(args, 'paramsSchemaForWallets')

      const rest = this._getREST(args.auth)

      return rest.wallets()
    }, 'getWallets', cb)
  }

  getLedgers (space, args, cb) {
    return this._responder(() => {
      return this._prepareApiResponse(
        args,
        'ledgers',
        {
          datePropName: 'mts',
          symbPropName: 'currency'
        }
      )
    }, 'getLedgers', cb)
  }

  getTrades (space, args, cb) {
    return this._responder(() => {
      return this._prepareApiResponse(
        args,
        'trades',
        {
          datePropName: 'mtsCreate',
          symbPropName: 'symbol'
        }
      )
    }, 'getTrades', cb)
  }

  getFundingTrades (space, args, cb) {
    return this._responder(() => {
      return this._prepareApiResponse(
        args,
        'fundingTrades',
        {
          datePropName: 'mtsCreate',
          symbPropName: 'symbol'
        }
      )
    }, 'getFundingTrades', cb)
  }

  getPublicTrades (space, args, cb) {
    return this._responder(() => {
      const _args = {
        ...args,
        auth: {}
      }

      return this._prepareApiResponse(
        _args,
        'publicTrades',
        {
          datePropName: 'mts'
        }
      )
    }, 'getPublicTrades', cb)
  }

  getStatusMessages (space, args, cb) {
    return this._responder(() => {
      const { params } = { ...args }
      const {
        type = 'deriv',
        symbol = ['ALL']
      } = { ...params }
      const _args = {
        ...args,
        auth: {},
        params: {
          ...params,
          type,
          symbol,
          notCheckNextPage: true
        }
      }

      return this._prepareApiResponse(
        _args,
        'statusMessages',
        {
          datePropName: 'timestamp',
          symbPropName: 'key'
        }
      )
    }, 'getStatusMessages', cb)
  }

  getCandles (space, args, cb) {
    return this._responder(() => {
      const { params } = { ...args }
      const {
        section = 'hist',
        timeframe = '1D'
      } = { ...params }
      const _args = {
        ...args,
        auth: {},
        params: {
          ...params,
          section,
          timeframe
        }
      }

      return this._prepareApiResponse(
        _args,
        'candles',
        {
          datePropName: 'mts'
        }
      )
    }, 'getCandles', cb)
  }

  getOrderTrades (space, args, cb) {
    return this._responder(() => {
      return this._prepareApiResponse(
        args,
        'orderTrades',
        {
          datePropName: 'mtsCreate',
          symbPropName: 'symbol'
        }
      )
    }, 'getOrderTrades', cb)
  }

  getOrders (space, args, cb) {
    return this._responder(() => {
      return this._prepareApiResponse(
        args,
        'orders',
        {
          datePropName: 'mtsUpdate',
          symbPropName: 'symbol',
          parseFieldsFn: (res) => parseFields(
            res,
            { executed: true }
          )
        }
      )
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
      return this._prepareApiResponse(
        args,
        'movements',
        {
          datePropName: 'mtsUpdated',
          symbPropName: 'currency'
        }
      )
    }, 'getMovements', cb)
  }

  getFundingOfferHistory (space, args, cb) {
    return this._responder(() => {
      return this._prepareApiResponse(
        args,
        'fundingOfferHistory',
        {
          datePropName: 'mtsUpdate',
          symbPropName: 'symbol',
          parseFieldsFn: (res) => parseFields(
            res,
            { executed: true, rate: true }
          )
        }
      )
    }, 'getFundingOfferHistory', cb)
  }

  getFundingLoanHistory (space, args, cb) {
    return this._responder(() => {
      return this._prepareApiResponse(
        args,
        'fundingLoanHistory',
        {
          datePropName: 'mtsUpdate',
          symbPropName: 'symbol',
          parseFieldsFn: (res) => parseFields(
            res,
            { rate: true }
          )
        }
      )
    }, 'getFundingLoanHistory', cb)
  }

  getFundingCreditHistory (space, args, cb) {
    return this._responder(() => {
      return this._prepareApiResponse(
        args,
        'fundingCreditHistory',
        {
          datePropName: 'mtsUpdate',
          symbPropName: 'symbol',
          parseFieldsFn: (res) => parseFields(
            res,
            { rate: true }
          )
        }
      )
    }, 'getFundingCreditHistory', cb)
  }

  getAccountSummary (space, args, cb) {
    return this._responder(async () => {
      const { auth } = { ...args }
      const rest = this._getREST(auth)

      const res = await rest.accountSummary()

      return Array.isArray(res) ? res : [res]
    }, 'getAccountSummary', cb)
  }

  getLogins (space, args, cb) {
    return this._responder(() => {
      return this._prepareApiResponse(
        args,
        'logins',
        {
          datePropName: 'time',
          parseFieldsFn: parseLoginsExtraDataFields
        }
      )
    }, 'getLogins', cb)
  }

  getMultipleCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getMultipleCsvJobData',
        args
      )
    }, 'getMultipleCsv', cb)
  }

  getTradesCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getTradesCsvJobData',
        args
      )
    }, 'getTradesCsv', cb)
  }

  getFundingTradesCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getFundingTradesCsvJobData',
        args
      )
    }, 'getFundingTradesCsv', cb)
  }

  getTickersHistoryCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getTickersHistoryCsvJobData',
        args
      )
    }, 'getTickersHistoryCsv', cb)
  }

  getWalletsCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getWalletsCsvJobData',
        args
      )
    }, 'getWalletsCsv', cb)
  }

  getPositionsHistoryCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getPositionsHistoryCsvJobData',
        args
      )
    }, 'getPositionsHistoryCsv', cb)
  }

  getActivePositionsCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getActivePositionsCsvJobData',
        args
      )
    }, 'getActivePositionsCsv', cb)
  }

  getPositionsAuditCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getPositionsAuditCsvJobData',
        args
      )
    }, 'getPositionsAuditCsv', cb)
  }

  getPublicTradesCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getPublicTradesCsvJobData',
        args
      )
    }, 'getPublicTradesCsv', cb)
  }

  getStatusMessagesCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getStatusMessagesCsvJobData',
        args
      )
    }, 'getStatusMessagesCsv', cb)
  }

  getCandlesCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getCandlesCsvJobData',
        args
      )
    }, 'getCandlesCsv', cb)
  }

  getLedgersCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getLedgersCsvJobData',
        args
      )
    }, 'getLedgersCsv', cb)
  }

  getOrderTradesCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getOrderTradesCsvJobData',
        args
      )
    }, 'getOrderTradesCsv', cb)
  }

  getOrdersCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getOrdersCsvJobData',
        args
      )
    }, 'getOrdersCsv', cb)
  }

  getActiveOrdersCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getActiveOrdersCsvJobData',
        args
      )
    }, 'getActiveOrdersCsv', cb)
  }

  getMovementsCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getMovementsCsvJobData',
        args
      )
    }, 'getMovementsCsv', cb)
  }

  getFundingOfferHistoryCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getFundingOfferHistoryCsvJobData',
        args
      )
    }, 'getFundingOfferHistoryCsv', cb)
  }

  getFundingLoanHistoryCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getFundingLoanHistoryCsvJobData',
        args
      )
    }, 'getFundingLoanHistoryCsv', cb)
  }

  getFundingCreditHistoryCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getFundingCreditHistoryCsvJobData',
        args
      )
    }, 'getFundingCreditHistoryCsv', cb)
  }

  getLoginsCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getLoginsCsvJobData',
        args
      )
    }, 'getLoginsCsv', cb)
  }
}

module.exports = ReportService
