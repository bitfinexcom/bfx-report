'use strict'

const { Api } = require('bfx-wrk-api')

const {
  checkParams,
  parseFields,
  parseLoginsExtraDataFields,
  accountCache,
  getTimezoneConf,
  filterModels,
  parsePositionsAuditId,
  prepareSymbolResponse
} = require('./helpers')
const {
  omitPrivateModelFields
} = require('./helpers/prepare-response/helpers')
const { AuthError } = require('./errors')
const TYPES = require('./di/types')

class ReportService extends Api {
  _initialize () {
    this.container = this.ctx.grc_bfx.caller.container

    this.container.get(TYPES.InjectDepsToRService)()
  }

  _generateToken (args, opts) {
    const rest = this._getREST(args?.auth, {
      interrupter: args?.interrupter
    })

    return rest.generateToken({
      ttl: opts?.ttl ?? 3600,
      scope: opts?.scope ?? 'api',
      writePermission: opts?.writePermission ?? false,
      _cust_ip: opts?._cust_ip ?? '0',
      ...opts
    })
  }

  _invalidateAuthToken (args) {
    const rest = this._getREST(args?.auth, {
      interrupter: args?.interrupter
    })
    const { authToken } = args?.params ?? {}

    return rest.invalidateAuthToken({ authToken })
  }

  _getUserInfo (args) {
    const rest = this._getREST(args.auth, {
      interrupter: args?.interrupter
    })

    return rest.userInfo()
  }

  _getSymbols (args) {
    const rest = this._getREST({}, {
      interrupter: args?.interrupter
    })

    return rest.symbols()
  }

  _getFutures (args) {
    const rest = this._getREST({}, {
      interrupter: args?.interrupter
    })

    return rest.futures()
  }

  _getCurrencies () {
    const rest = this._getREST({})

    return rest.currencies()
  }

  _getInactiveSymbols (args) {
    const rest = this._getREST({}, {
      interrupter: args?.interrupter
    })

    return rest.inactiveSymbols()
  }

  async _getConf (args) {
    const { keys: _keys, interrupter } = args ?? {}
    const keys = Array.isArray(_keys) ? _keys : [_keys]
    const rest = this._getREST({}, { interrupter })

    const res = await rest.conf({ keys })

    return Array.isArray(res) ? res : []
  }

  async _getMapSymbols (args) {
    const [res] = await this._getConf({
      keys: 'pub:map:pair:sym',
      interrupter: args?.interrupter
    })

    return Array.isArray(res) ? res : []
  }

  async _getInactiveCurrencies (args) {
    const [res] = await this._getConf({
      keys: 'pub:list:currency:inactive',
      interrupter: args?.interrupter
    })

    return Array.isArray(res) ? res : []
  }

  async _getMarginCurrencyList (args) {
    const [res] = await this._getConf({
      keys: 'pub:list:currency:margin',
      interrupter: args?.interrupter
    })

    return Array.isArray(res) ? res : []
  }

  _getWeightedAveragesReportFromApi (args) {
    const { auth, params } = args ?? {}

    const rest = this._getREST(auth, {
      interrupter: args?.interrupter
    })

    return rest.getWeightedAverages(params)
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
        id,
        isUserMerchant
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
        _id: null, // to have the same data structure as in framework mode
        isUserMerchant: !!isUserMerchant
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
        inactiveCurrencies,
        marginCurrencyList
      ] = await Promise.all([
        this._getSymbols(args),
        this._getFutures(args),
        this._getCurrencies(args),
        this._getInactiveSymbols(args),
        this._getMapSymbols(args),
        this._getInactiveCurrencies(args),
        this._getMarginCurrencyList(args)
      ])

      const res = prepareSymbolResponse({
        symbols,
        futures,
        currencies,
        inactiveSymbols,
        mapSymbols,
        inactiveCurrencies,
        marginCurrencyList
      })

      accountCache.set('symbols', res)

      return res
    }, 'getSymbols', args, cb)
  }

  getSettings (space, args, cb) {
    return this._responder(async () => {
      const { auth, params } = args ?? {}
      const { keys = [] } = params ?? {}

      const rest = this._getREST(auth, {
        interrupter: args?.interrupter
      })

      return rest.getSettings({ keys })
    }, 'getSettings', args, cb)
  }

  updateSettings (space, args, cb) {
    return this._responder(async () => {
      const { auth, params } = args ?? {}
      const { settings = {} } = params ?? {}

      const rest = this._getREST(auth, {
        interrupter: args?.interrupter
      })

      return rest.updateSettings({ settings })
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
      const rest = this._getREST(args.auth, {
        interrupter: args?.interrupter
      })
      const positions = omitPrivateModelFields(
        await rest.positions()
      )

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

      const rest = this._getREST(args.auth, {
        interrupter: args?.interrupter
      })

      return omitPrivateModelFields(await rest.wallets())
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
      const rest = this._getREST(args.auth, {
        interrupter: args?.interrupter
      })

      const _res = omitPrivateModelFields(
        await rest.activeOrders()
      )

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

  getMovementInfo (space, args, cb) {
    return this._responder(async () => {
      checkParams(args, 'paramsSchemaForMovementInfo', ['id'])

      const { auth, params, interrupter } = args ?? {}
      const rest = this._getREST(auth, { interrupter })

      const res = omitPrivateModelFields(
        await rest.movementInfo({ id: params?.id })
      )

      return Array.isArray(res)
        ? res[0] ?? {}
        : res
    }, 'getMovementInfo', args, cb)
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
      const rest = this._getREST(auth, {
        timeout: 30000,
        interrupter: args?.interrupter
      })

      const res = omitPrivateModelFields(
        await rest.accountSummary()
      )

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
      this._dataValidator.validate(
        args,
        this._dataValidator.SCHEMA_IDS.GET_WEIGHTED_AVERAGES_REPORT_REQ
      )

      return this._weightedAveragesReport
        .getWeightedAveragesReport(args)
    }, 'getWeightedAveragesReport', args, cb)
  }

  getMultipleFile (space, args, cb) {
    return this._responder(() => {
      return this._generateReportFile(
        'getMultipleFileJobData',
        args
      )
    }, 'getMultipleFile', args, cb)
  }

  getTradesFile (space, args, cb) {
    return this._responder(() => {
      return this._generateReportFile(
        'getTradesFileJobData',
        args
      )
    }, 'getTradesFile', args, cb)
  }

  getFundingTradesFile (space, args, cb) {
    return this._responder(() => {
      return this._generateReportFile(
        'getFundingTradesFileJobData',
        args
      )
    }, 'getFundingTradesFile', args, cb)
  }

  getTickersHistoryFile (space, args, cb) {
    return this._responder(() => {
      return this._generateReportFile(
        'getTickersHistoryFileJobData',
        args
      )
    }, 'getTickersHistoryFile', args, cb)
  }

  getWalletsFile (space, args, cb) {
    return this._responder(() => {
      return this._generateReportFile(
        'getWalletsFileJobData',
        args
      )
    }, 'getWalletsFile', args, cb)
  }

  getPositionsHistoryFile (space, args, cb) {
    return this._responder(() => {
      return this._generateReportFile(
        'getPositionsHistoryFileJobData',
        args
      )
    }, 'getPositionsHistoryFile', args, cb)
  }

  getActivePositionsFile (space, args, cb) {
    return this._responder(() => {
      return this._generateReportFile(
        'getActivePositionsFileJobData',
        args
      )
    }, 'getActivePositionsFile', args, cb)
  }

  getPositionsAuditFile (space, args, cb) {
    return this._responder(() => {
      return this._generateReportFile(
        'getPositionsAuditFileJobData',
        args
      )
    }, 'getPositionsAuditFile', args, cb)
  }

  getPublicTradesFile (space, args, cb) {
    return this._responder(() => {
      return this._generateReportFile(
        'getPublicTradesFileJobData',
        args
      )
    }, 'getPublicTradesFile', args, cb)
  }

  getStatusMessagesFile (space, args, cb) {
    return this._responder(() => {
      return this._generateReportFile(
        'getStatusMessagesFileJobData',
        args
      )
    }, 'getStatusMessagesFile', args, cb)
  }

  getCandlesFile (space, args, cb) {
    return this._responder(() => {
      return this._generateReportFile(
        'getCandlesFileJobData',
        args
      )
    }, 'getCandlesFile', args, cb)
  }

  getLedgersFile (space, args, cb) {
    return this._responder(() => {
      return this._generateReportFile(
        'getLedgersFileJobData',
        args
      )
    }, 'getLedgersFile', args, cb)
  }

  getPayInvoiceListFile (space, args, cb) {
    return this._responder(() => {
      return this._generateReportFile(
        'getPayInvoiceListFileJobData',
        args
      )
    }, 'getPayInvoiceListFile', args, cb)
  }

  getOrderTradesFile (space, args, cb) {
    return this._responder(() => {
      return this._generateReportFile(
        'getOrderTradesFileJobData',
        args
      )
    }, 'getOrderTradesFile', args, cb)
  }

  getOrdersFile (space, args, cb) {
    return this._responder(() => {
      return this._generateReportFile(
        'getOrdersFileJobData',
        args
      )
    }, 'getOrdersFile', args, cb)
  }

  getActiveOrdersFile (space, args, cb) {
    return this._responder(() => {
      return this._generateReportFile(
        'getActiveOrdersFileJobData',
        args
      )
    }, 'getActiveOrdersFile', args, cb)
  }

  getMovementsFile (space, args, cb) {
    return this._responder(() => {
      return this._generateReportFile(
        'getMovementsFileJobData',
        args
      )
    }, 'getMovementsFile', args, cb)
  }

  getFundingOfferHistoryFile (space, args, cb) {
    return this._responder(() => {
      return this._generateReportFile(
        'getFundingOfferHistoryFileJobData',
        args
      )
    }, 'getFundingOfferHistoryFile', args, cb)
  }

  getFundingLoanHistoryFile (space, args, cb) {
    return this._responder(() => {
      return this._generateReportFile(
        'getFundingLoanHistoryFileJobData',
        args
      )
    }, 'getFundingLoanHistoryFile', args, cb)
  }

  getFundingCreditHistoryFile (space, args, cb) {
    return this._responder(() => {
      return this._generateReportFile(
        'getFundingCreditHistoryFileJobData',
        args
      )
    }, 'getFundingCreditHistoryFile', args, cb)
  }

  getLoginsFile (space, args, cb) {
    return this._responder(() => {
      return this._generateReportFile(
        'getLoginsFileJobData',
        args
      )
    }, 'getLoginsFile', args, cb)
  }

  getChangeLogsFile (space, args, cb) {
    return this._responder(() => {
      return this._generateReportFile(
        'getChangeLogsFileJobData',
        args
      )
    }, 'getChangeLogsFile', args, cb)
  }

  getWeightedAveragesReportFile (space, args, cb) {
    return this._responder(() => {
      return this._generateReportFile(
        'getWeightedAveragesReportFileJobData',
        args
      )
    }, 'getWeightedAveragesReportFile', args, cb)
  }
}

module.exports = ReportService
