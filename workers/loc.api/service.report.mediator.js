'use strict'

const { promisify } = require('util')
const { isEmpty, pick } = require('lodash')

const ReportService = require('./service.report')
const DAO = require('./sync/dao/dao')
const {
  setDao,
  publicСollsСonfAccessors
} = require('./sync/colls.accessors')
const {
  checkParams,
  checkParamsAuth,
  isAuthError,
  isEnotfoundError,
  isEaiAgainError,
  getTimezoneConf,
  emptyRes
} = require('./helpers')
const {
  collObjToArr,
  getProgress
} = require('./sync/helpers')
const { getMethodCollMap } = require('./sync/schema')
const { ALLOWED_COLLS } = require('./sync/allowed.colls')
const sync = require('./sync')

class MediatorReportService extends ReportService {
  async login (space, args, cb) {
    try {
      let userInfo = {
        email: null,
        timezone: null
      }

      try {
        userInfo = await this._checkAuthInApi(args)
      } catch (err) {
        if (isAuthError(err)) {
          throw err
        }
      }

      const res = {
        ...args.auth,
        ...userInfo
      }

      await this.dao.insertOrUpdateUser(res)

      if (!cb) return userInfo.email
      cb(null, userInfo.email)
    } catch (err) {
      if (!cb) throw err
      cb(err)
    }
  }

  async logout (space, args, cb) {
    try {
      await this.dao.deactivateUser(args.auth)

      if (!cb) return true
      cb(null, true)
    } catch (err) {
      if (!cb) throw err
      cb(err)
    }
  }

  async checkAuthInDb (space, args, cb) {
    try {
      const { email } = await this.dao.checkAuthInDb(args)

      if (!cb) return email
      cb(null, email)
    } catch (err) {
      if (!cb) throw err
      cb(err)
    }
  }

  async pingApi (space, args, cb) {
    try {
      await this._getSymbols()

      if (!cb) return true
      cb(null, true)
    } catch (err) {
      const wrk = this.ctx.grc_bfx.caller
      const group = wrk.group
      const conf = wrk.conf[group]

      const _err = isEnotfoundError(err) || isEaiAgainError(err)
        ? new Error(`The server ${conf.restUrl} is not available`)
        : null

      if (!cb) throw _err || err
      if (_err) {
        cb(null, false)

        return
      }

      cb(err)
    }
  }

  async enableSyncMode (space, args, cb) {
    try {
      checkParamsAuth(args)
      await this.dao.updateStateOf('syncMode', true)
      await this.dao.updateUserByAuth({
        ...pick(args.auth, ['apiKey', 'apiSecret']),
        isDataFromDb: 1
      })
      await sync(true)

      if (!cb) return true
      cb(null, true)
    } catch (err) {
      if (!cb) throw err
      cb(err)
    }
  }

  async disableSyncMode (space, args, cb) {
    try {
      checkParamsAuth(args)
      await this.dao.updateUserByAuth({
        ...pick(args.auth, ['apiKey', 'apiSecret']),
        isDataFromDb: 0
      })

      if (!cb) return true
      cb(null, true)
    } catch (err) {
      if (!cb) throw err
      cb(err)
    }
  }

  async isSyncModeWithDbData (space, args, cb) {
    try {
      const user = await this.dao.checkAuthInDb(args, false)
      const firstElem = await this.dao.getFirstElemInCollBy('syncMode')

      const res = !isEmpty(firstElem) &&
        !isEmpty(user) &&
        !!firstElem.isEnable &&
        user.isDataFromDb

      if (!cb) return res
      cb(null, res)
    } catch (err) {
      if (!cb) throw err
      cb(err)
    }
  }

  async enableScheduler (space, args, cb) {
    try {
      await this.dao.checkAuthInDb(args)
      await this.dao.updateStateOf('scheduler', true)
      const res = await this.syncNow()

      if (!cb) return res
      cb(null, res)
    } catch (err) {
      if (!cb) throw err
      cb(err)
    }
  }

  async disableScheduler (space, args, cb) {
    try {
      await this.dao.checkAuthInDb(args)
      await this.dao.updateStateOf('scheduler', false)

      if (!cb) return true
      cb(null, true)
    } catch (err) {
      if (!cb) throw err
      cb(err)
    }
  }

  async isSchedulerEnabled (space, args, cb) {
    try {
      const firstElem = await this.dao.getFirstElemInCollBy(
        'scheduler',
        { isEnable: 1 }
      )

      const res = !isEmpty(firstElem)

      if (!cb) return res
      cb(null, res)
    } catch (err) {
      if (!cb) return false
      cb(null, false)
    }
  }

  async getSyncProgress (space, args, cb) {
    try {
      const user = await this.dao.checkAuthInDb(args, false)
      const isSchedulerEnabled = await this.isSchedulerEnabled()
      const res = (
        !isEmpty(user) &&
        user.isDataFromDb &&
        isSchedulerEnabled
      )
        ? await getProgress(this)
        : false

      if (!cb) return res
      cb(null, res)
    } catch (err) {
      if (!cb) throw err
      cb(err)
    }
  }

  async syncNow (space, args = {}, cb) {
    try {
      if (cb) {
        await this.dao.checkAuthInDb(args)
      }

      const syncColls = (
        args &&
        typeof args === 'object' &&
        args.params &&
        typeof args.params === 'object' &&
        args.params.syncColls
      )
        ? args.params.syncColls
        : ALLOWED_COLLS.ALL

      const res = await sync(true, syncColls)

      if (!cb) return res
      cb(null, res)
    } catch (err) {
      if (!cb) throw err
      cb(err)
    }
  }

  async getPublicTradesConf (space, args = {}, cb) {
    try {
      const res = await publicСollsСonfAccessors
        .getPublicСollsСonf('publicTradesConf', args)

      if (!cb) return res
      cb(null, res)
    } catch (err) {
      if (!cb) throw err
      cb(err)
    }
  }

  async getTickersHistoryConf (space, args = {}, cb) {
    try {
      const res = await publicСollsСonfAccessors
        .getPublicСollsСonf('tickersHistoryConf', args)

      if (!cb) return res
      cb(null, res)
    } catch (err) {
      if (!cb) throw err
      cb(err)
    }
  }

  async editPublicTradesConf (space, args = {}, cb) {
    try {
      checkParams(args, 'paramsSchemaForEditPublicСollsСonf')

      await publicСollsСonfAccessors
        .editPublicСollsСonf('publicTradesConf', args)
      await sync(true, ALLOWED_COLLS.PUBLIC_TRADES)

      if (!cb) return true
      cb(null, true)
    } catch (err) {
      if (!cb) throw err
      cb(err)
    }
  }

  async editTickersHistoryConf (space, args = {}, cb) {
    try {
      checkParams(args, 'paramsSchemaForEditPublicСollsСonf')

      await publicСollsСonfAccessors
        .editPublicСollsСonf('tickersHistoryConf', args)
      await sync(true, ALLOWED_COLLS.TICKERS_HISTORY)

      if (!cb) return true
      cb(null, true)
    } catch (err) {
      if (!cb) throw err
      cb(err)
    }
  }

  /**
   * @override
   */
  async getEmail (space, args, cb) {
    try {
      if (!await this.isSyncModeWithDbData(space, args)) {
        super.getEmail(space, args, cb)

        return
      }

      const user = await this.dao.checkAuthInDb(args)

      cb(null, user.email)
    } catch (err) {
      cb(err)
    }
  }

  /**
   * @override
   */
  async getUsersTimeConf (space, args, cb) {
    try {
      if (!await this.isSyncModeWithDbData(space, args)) {
        super.getUsersTimeConf(space, args, cb)

        return
      }

      const { timezone } = await this.dao.checkAuthInDb(args)
      const res = getTimezoneConf(timezone)

      cb(null, res)
    } catch (err) {
      cb(err)
    }
  }

  /**
   * @override
   */
  async getSymbols (space, args, cb) {
    try {
      if (!await this.isSyncModeWithDbData(space, args)) {
        super.getSymbols(space, args, cb)

        return
      }

      checkParams(args, 'paramsSchemaForApi')

      const symbolsMethod = '_getSymbols'
      const currenciesMethod = '_getCurrencies'
      const { field } = getMethodCollMap().get(symbolsMethod)
      const symbols = await this.dao.findInCollBy(
        symbolsMethod,
        args,
        false,
        true
      )
      const currencies = await this.dao.findInCollBy(
        currenciesMethod,
        args,
        false,
        true
      )
      const pairs = collObjToArr(symbols, field)
      const res = { pairs, currencies }

      cb(null, res)
    } catch (err) {
      cb(err)
    }
  }

  /**
   * @override
   */
  async getTickersHistory (space, args, cb) {
    try {
      if (!await this.isSyncModeWithDbData(space, args)) {
        super.getTickersHistory(space, args, cb)

        return
      }

      checkParams(args, 'paramsSchemaForApi', ['symbol'])

      const confs = await publicСollsСonfAccessors.getPublicСollsСonf(
        'tickersHistoryConf',
        args
      )

      if (isEmpty(confs)) {
        emptyRes(cb)

        return
      }

      const _symb = args.params.symbol ? [args.params.symbol] : []
      const symbols = Array.isArray(args.params.symbol)
        ? args.params.symbol
        : _symb
      const filteredSymbols = symbols.filter(symb => {
        return confs.some(conf => symb === conf.symbol)
      })

      if (
        !isEmpty(symbols) &&
        isEmpty(filteredSymbols)
      ) {
        emptyRes(cb)

        return
      }

      args.params.symbol = filteredSymbols

      const minConfStart = confs.reduce(
        (accum, conf) => {
          return (accum === null || conf.start < accum) ? conf.start : accum
        },
        null
      )

      if (
        Number.isFinite(args.params.start) &&
        args.params.start < minConfStart
      ) {
        args.params.start = minConfStart
      }

      const res = await this.dao.findInCollBy(
        '_getTickersHistory',
        args,
        true,
        true
      )

      cb(null, res)
    } catch (err) {
      cb(err)
    }
  }

  /**
   * @override
   */
  async getPositionsHistory (space, args, cb) {
    try {
      if (!await this.isSyncModeWithDbData(space, args)) {
        super.getPositionsHistory(space, args, cb)

        return
      }

      checkParams(args, 'paramsSchemaForApi')

      const res = await this.dao.findInCollBy(
        '_getPositionsHistory',
        args,
        true
      )

      cb(null, res)
    } catch (err) {
      cb(err)
    }
  }

  /**
   * @override
   */
  async getLedgers (space, args, cb) {
    try {
      if (!await this.isSyncModeWithDbData(space, args)) {
        super.getLedgers(space, args, cb)

        return
      }

      checkParams(args, 'paramsSchemaForApi')

      const res = await this.dao.findInCollBy(
        '_getLedgers',
        args,
        true
      )

      cb(null, res)
    } catch (err) {
      cb(err)
    }
  }

  /**
   * @override
   */
  async getTrades (space, args, cb) {
    try {
      if (!await this.isSyncModeWithDbData(space, args)) {
        super.getTrades(space, args, cb)

        return
      }

      checkParams(args, 'paramsSchemaForApi')

      const res = await this.dao.findInCollBy(
        '_getTrades',
        args,
        true
      )

      cb(null, res)
    } catch (err) {
      cb(err)
    }
  }

  /**
   * @override
   */
  async getPublicTrades (space, args, cb) {
    try {
      if (!await this.isSyncModeWithDbData(space, args)) {
        super.getPublicTrades(space, args, cb)

        return
      }

      checkParams(args, 'paramsSchemaForPublicTrades', ['symbol'])

      const symbol = Array.isArray(args.params.symbol)
        ? args.params.symbol[0]
        : args.params.symbol
      const { _id } = await this.dao.checkAuthInDb(args)
      const conf = await this.dao.getElemInCollBy(
        'publicСollsСonf',
        {
          confName: 'publicTradesConf',
          user_id: _id,
          symbol
        },
        [['symbol', 1]]
      )

      if (isEmpty(conf)) {
        emptyRes(cb)

        return
      }

      if (
        Number.isFinite(args.params.start) &&
        args.params.start < conf.start
      ) {
        args.params.start = conf.start
      }

      const res = await this.dao.findInCollBy(
        '_getPublicTrades',
        args,
        true,
        true
      )

      cb(null, res)
    } catch (err) {
      cb(err)
    }
  }

  /**
   * @override
   */
  async getOrders (space, args, cb) {
    try {
      if (!await this.isSyncModeWithDbData(space, args)) {
        super.getOrders(space, args, cb)

        return
      }

      checkParams(args, 'paramsSchemaForApi')

      const res = await this.dao.findInCollBy(
        '_getOrders',
        args,
        true
      )

      cb(null, res)
    } catch (err) {
      cb(err)
    }
  }

  /**
   * @override
   */
  async getMovements (space, args, cb) {
    try {
      if (!await this.isSyncModeWithDbData(space, args)) {
        super.getMovements(space, args, cb)

        return
      }

      checkParams(args, 'paramsSchemaForApi')

      const res = await this.dao.findInCollBy(
        '_getMovements',
        args,
        true
      )

      cb(null, res)
    } catch (err) {
      cb(err)
    }
  }

  /**
   * @override
   */
  async getFundingOfferHistory (space, args, cb) {
    try {
      if (!await this.isSyncModeWithDbData(space, args)) {
        super.getFundingOfferHistory(space, args, cb)

        return
      }

      checkParams(args, 'paramsSchemaForApi')

      const res = await this.dao.findInCollBy(
        '_getFundingOfferHistory',
        args,
        true
      )

      cb(null, res)
    } catch (err) {
      cb(err)
    }
  }

  /**
   * @override
   */
  async getFundingLoanHistory (space, args, cb) {
    try {
      if (!await this.isSyncModeWithDbData(space, args)) {
        super.getFundingLoanHistory(space, args, cb)

        return
      }

      checkParams(args, 'paramsSchemaForApi')

      const res = await this.dao.findInCollBy(
        '_getFundingLoanHistory',
        args,
        true
      )

      cb(null, res)
    } catch (err) {
      cb(err)
    }
  }

  /**
   * @override
   */
  async getFundingCreditHistory (space, args, cb) {
    try {
      if (!await this.isSyncModeWithDbData(space, args)) {
        super.getFundingCreditHistory(space, args, cb)

        return
      }

      checkParams(args, 'paramsSchemaForApi')

      const res = await this.dao.findInCollBy(
        '_getFundingCreditHistory',
        args,
        true
      )

      cb(null, res)
    } catch (err) {
      cb(err)
    }
  }

  _getTickersHistory (args) {
    return promisify(super.getTickersHistory.bind(this))(null, args)
  }

  _getPositionsHistory (args) {
    return promisify(super.getPositionsHistory.bind(this))(null, args)
  }

  _getLedgers (args) {
    return promisify(super.getLedgers.bind(this))(null, args)
  }

  _getTrades (args) {
    return promisify(super.getTrades.bind(this))(null, args)
  }

  _getPublicTrades (args) {
    return promisify(super.getPublicTrades.bind(this))(null, args)
  }

  _getOrders (args) {
    return promisify(super.getOrders.bind(this))(null, args)
  }

  _getMovements (args) {
    return promisify(super.getMovements.bind(this))(null, args)
  }

  _getFundingOfferHistory (args) {
    return promisify(super.getFundingOfferHistory.bind(this))(null, args)
  }

  _getFundingLoanHistory (args) {
    return promisify(super.getFundingLoanHistory.bind(this))(null, args)
  }

  _getFundingCreditHistory (args) {
    return promisify(super.getFundingCreditHistory.bind(this))(null, args)
  }

  async _checkAuthInApi (args) {
    checkParamsAuth(args)

    const {
      email,
      timezone
    } = await this._getUserInfo(args)

    if (!email) {
      throw new Error('ERR_AUTH_UNAUTHORIZED')
    }

    return {
      email,
      timezone
    }
  }

  async _syncModeInitialize () {
    await this._databaseInitialize()

    await this.dao.updateProgress('SYNCHRONIZATION_HAS_NOT_STARTED_YET')
    await this.dao.updateStateOf('syncMode', true)
    await this.dao.updateStateOf('scheduler', true)
  }

  /**
   * @abstract
   */
  async _databaseInitialize (dao) {
    if (!dao || !(dao instanceof DAO)) {
      throw new Error('ERR_DAO_NOT_INITIALIZED')
    }

    this.dao = dao
    setDao(dao)

    await this.dao.databaseInitialize()
  }
}

module.exports = MediatorReportService
