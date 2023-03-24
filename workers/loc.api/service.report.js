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
const { AuthError } = require('./errors')
const TYPES = require('./di/types')

class ReportService extends Api {
  _initialize () {
    this.container = this.ctx.grc_bfx.caller.container

    this.container.get(TYPES.InjectDepsToRService)()
  }

  _generateToken (args, opts) {
    const rest = this._getREST(args?.auth)

    return rest.generateToken({
      ttl: opts?.ttl ?? 3600,
      scope: opts?.scope ?? 'api',
      writePermission: opts?.writePermission ?? false,
      _cust_ip: opts?._cust_ip ?? '0',
      ...opts
    })
  }

  _invalidateAuthToken (args) {
    const rest = this._getREST(args?.auth)
    const { authToken } = args?.params ?? {}

    return rest.invalidateAuthToken(authToken)
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

  _getInactiveSymbols () {
    const rest = this._getREST({})

    return rest.inactiveSymbols()
  }

  async _getConf (opts) {
    const { keys } = { ...opts }
    const _keys = Array.isArray(keys) ? keys : [keys]
    const rest = this._getREST({})

    const res = await rest.conf(_keys)

    return Array.isArray(res) ? res : []
  }

  async _getMapSymbols () {
    const [res] = await this._getConf({
      keys: 'pub:map:pair:sym'
    })

    return Array.isArray(res) ? res : []
  }

  async _getInactiveCurrencies () {
    const [res] = await this._getConf({
      keys: 'pub:list:currency:inactive'
    })

    return Array.isArray(res) ? res : []
  }

  getPositionsSnapshot (space, args, cb) {
    return this._responder(() => {
      return this._prepareApiResponse(
        args,
        'positionsSnapshot',
        {
          datePropName: 'mtsUpdate',
          symbPropName: 'symbol'
        }
      )
    }, 'getPositionsSnapshot', args, cb)
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
    }, 'getFilterModels', args, cb)
  }

  verifyDigitalSignature (space, args, cb) {
    return this._responder(() => {
      return this._grcBfxReq({
        service: 'rest:ext:gpg',
        action: 'verifyDigitalSignature',
        args: [null, args]
      })
    }, 'verifyDigitalSignature', args, cb)
  }

  isSyncModeConfig (space, args, cb) {
    return this._responder(() => {
      return this.container.get(TYPES.CONF).syncMode
    }, 'isSyncModeConfig', args, cb)
  }

  verifyUser (space, args, cb) {
    return this._responder(async () => {
      const {
        username,
        timezone,
        email,
        id
      } = await this._getUserInfo(args)

      if (!email) {
        throw new AuthError()
      }

      return {
        username,
        timezone,
        email,
        id,
        isSubAccount: false,
        _id: null // to have the same data structure as in framework mode
      }
    }, 'verifyUser', args, cb)
  }

  generateToken (space, args, cb) {
    return this._responder(async () => {
      return this._generateToken(args)
    }, 'generateToken', args, cb)
  }

  invalidateAuthToken (space, args, cb) {
    return this._responder(async () => {
      return this._invalidateAuthToken(args)
    }, 'invalidateAuthToken', args, cb)
  }

  getUsersTimeConf (space, args, cb) {
    return this._responder(async () => {
      const { timezone } = await this._getUserInfo(args)

      return getTimezoneConf(timezone)
    }, 'getUsersTimeConf', args, cb)
  }

  getSymbols (space, args, cb) {
    return this._responder(async () => {
      const cache = accountCache.get('symbols')

      if (cache) return cache

      const [
        symbols,
        futures,
        currencies,
        inactiveSymbols,
        mapSymbols,
        inactiveCurrencies
      ] = await Promise.all([
        this._getSymbols(),
        this._getFutures(),
        this._getCurrencies(),
        this._getInactiveSymbols(),
        this._getMapSymbols(),
        this._getInactiveCurrencies()
      ])

      const pairs = [...symbols, ...futures]
      const res = {
        pairs,
        currencies,
        inactiveSymbols,
        mapSymbols,
        inactiveCurrencies
      }

      accountCache.set('symbols', res)

      return res
    }, 'getSymbols', args, cb)
  }

  getSettings (space, args, cb) {
    return this._responder(async () => {
      const { auth, params } = { ...args }
      const { keys = [] } = { ...params }

      const rest = this._getREST(auth)

      return rest.getSettings(keys)
    }, 'getSettings', args, cb)
  }

  updateSettings (space, args, cb) {
    return this._responder(async () => {
      const { auth, params } = { ...args }
      const { settings = {} } = { ...params }

      const rest = this._getREST(auth)

      return rest.updateSettings(settings)
    }, 'updateSettings', args, cb)
  }

  getTickersHistory (space, args, cb) {
    return this._responder(() => {
      const {
        params,
        isNotMoreThanInnerMax
      } = args ?? {}
      const { symbol: s } = params ?? {}
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
          requireFields: ['symbol'],
          isNotMoreThanInnerMax
        }
      )
    }, 'getTickersHistory', args, cb)
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
    }, 'getPositionsHistory', args, cb)
  }

  getActivePositions (space, args, cb) {
    return this._responder(async () => {
      const rest = this._getREST(args.auth)
      const positions = await rest.positions()

      return Array.isArray(positions)
        ? positions.filter(({ status }) => status === 'ACTIVE')
        : []
    }, 'getActivePositions', args, cb)
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
    }, 'getPositionsAudit', args, cb)
  }

  getWallets (space, args, cb) {
    return this._responder(async () => {
      checkParams(args, 'paramsSchemaForWallets')

      const rest = this._getREST(args.auth)

      return rest.wallets()
    }, 'getWallets', args, cb)
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
    }, 'getLedgers', args, cb)
  }

  getPayInvoiceList (space, args, cb) {
    return this._responder(() => {
      return this._prepareApiResponse(
        args,
        'payInvoiceList',
        {
          datePropName: 't',
          symbPropName: 'currency'
        }
      )
    }, 'getInvoiceList', args, cb)
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
    }, 'getTrades', args, cb)
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
    }, 'getFundingTrades', args, cb)
  }

  getPublicTrades (space, args, cb) {
    return this._responder(() => {
      const { isNotMoreThanInnerMax } = args ?? {}
      const _args = {
        ...args,
        auth: {}
      }

      return this._prepareApiResponse(
        _args,
        'publicTrades',
        {
          datePropName: 'mts',
          isNotMoreThanInnerMax
        }
      )
    }, 'getPublicTrades', args, cb)
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
    }, 'getStatusMessages', args, cb)
  }

  getCandles (space, args, cb) {
    return this._responder(() => {
      const {
        params,
        isNotMoreThanInnerMax
      } = args ?? {}
      const {
        section = 'hist',
        timeframe = '1D'
      } = params ?? {}
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
          datePropName: 'mts',
          isNotMoreThanInnerMax
        }
      )
    }, 'getCandles', args, cb)
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
    }, 'getOrderTrades', args, cb)
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
    }, 'getOrders', args, cb)
  }

  getActiveOrders (space, args, cb) {
    return this._responder(async () => {
      const rest = this._getREST(args.auth)

      const _res = await rest.activeOrders()

      return parseFields(_res, { executed: true })
    }, 'getActiveOrders', args, cb)
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
    }, 'getMovements', args, cb)
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
    }, 'getFundingOfferHistory', args, cb)
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
    }, 'getFundingLoanHistory', args, cb)
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
    }, 'getFundingCreditHistory', args, cb)
  }

  getAccountSummary (space, args, cb) {
    return this._responder(async () => {
      const { auth } = { ...args }
      const rest = this._getREST(auth)

      const res = await rest.accountSummary()

      return Array.isArray(res) ? res : [res]
    }, 'getAccountSummary', args, cb)
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
    }, 'getLogins', args, cb)
  }

  getChangeLogs (space, args, cb) {
    return this._responder(() => {
      return this._prepareApiResponse(
        args,
        'changeLogs',
        {
          datePropName: 'mtsCreate'
        }
      )
    }, 'getChangeLogs', args, cb)
  }

  getWeightedAveragesReport (space, args, cb) {
    return this._responder(async () => {
      checkParams(args, 'paramsSchemaForWeightedAveragesReportApi')

      return this._weightedAveragesReport
        .getWeightedAveragesReport(args)
    }, 'getWeightedAveragesReport', args, cb)
  }

  getMultipleCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getMultipleCsvJobData',
        args
      )
    }, 'getMultipleCsv', args, cb)
  }

  getTradesCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getTradesCsvJobData',
        args
      )
    }, 'getTradesCsv', args, cb)
  }

  getFundingTradesCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getFundingTradesCsvJobData',
        args
      )
    }, 'getFundingTradesCsv', args, cb)
  }

  getTickersHistoryCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getTickersHistoryCsvJobData',
        args
      )
    }, 'getTickersHistoryCsv', args, cb)
  }

  getWalletsCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getWalletsCsvJobData',
        args
      )
    }, 'getWalletsCsv', args, cb)
  }

  getPositionsHistoryCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getPositionsHistoryCsvJobData',
        args
      )
    }, 'getPositionsHistoryCsv', args, cb)
  }

  getActivePositionsCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getActivePositionsCsvJobData',
        args
      )
    }, 'getActivePositionsCsv', args, cb)
  }

  getPositionsAuditCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getPositionsAuditCsvJobData',
        args
      )
    }, 'getPositionsAuditCsv', args, cb)
  }

  getPublicTradesCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getPublicTradesCsvJobData',
        args
      )
    }, 'getPublicTradesCsv', args, cb)
  }

  getStatusMessagesCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getStatusMessagesCsvJobData',
        args
      )
    }, 'getStatusMessagesCsv', args, cb)
  }

  getCandlesCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getCandlesCsvJobData',
        args
      )
    }, 'getCandlesCsv', args, cb)
  }

  getLedgersCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getLedgersCsvJobData',
        args
      )
    }, 'getLedgersCsv', args, cb)
  }

  getPayInvoiceListCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getPayInvoiceListCsvJobData',
        args
      )
    }, 'getPayInvoiceListCsv', args, cb)
  }

  getOrderTradesCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getOrderTradesCsvJobData',
        args
      )
    }, 'getOrderTradesCsv', args, cb)
  }

  getOrdersCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getOrdersCsvJobData',
        args
      )
    }, 'getOrdersCsv', args, cb)
  }

  getActiveOrdersCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getActiveOrdersCsvJobData',
        args
      )
    }, 'getActiveOrdersCsv', args, cb)
  }

  getMovementsCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getMovementsCsvJobData',
        args
      )
    }, 'getMovementsCsv', args, cb)
  }

  getFundingOfferHistoryCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getFundingOfferHistoryCsvJobData',
        args
      )
    }, 'getFundingOfferHistoryCsv', args, cb)
  }

  getFundingLoanHistoryCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getFundingLoanHistoryCsvJobData',
        args
      )
    }, 'getFundingLoanHistoryCsv', args, cb)
  }

  getFundingCreditHistoryCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getFundingCreditHistoryCsvJobData',
        args
      )
    }, 'getFundingCreditHistoryCsv', args, cb)
  }

  getLoginsCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getLoginsCsvJobData',
        args
      )
    }, 'getLoginsCsv', args, cb)
  }

  getChangeLogsCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getChangeLogsCsvJobData',
        args
      )
    }, 'getChangeLogsCsv', args, cb)
  }

  getWeightedAveragesReportCsv (space, args, cb) {
    return this._responder(() => {
      return this._generateCsv(
        'getWeightedAveragesReportCsvJobData',
        args
      )
    }, 'getWeightedAveragesReportCsv', args, cb)
  }
}

module.exports = ReportService
