'use strict'

const { promisify } = require('util')
const { isEmpty } = require('lodash')

const ReportService = require('./service.report')
const {
  checkParams,
  checkParamsAuth,
  convertPairsToCoins
} = require('./helpers')
const {
  collObjToArr,
  getProgress
} = require('./sync/helpers')
const { getMethodCollMap } = require('./sync/schema')
const sync = require('./sync')

class MediatorReportService extends ReportService {
  async login (space, args, cb) {
    try {
      const email = await this._checkAuthInApi(args)

      const res = {
        ...args.auth,
        email
      }

      await this.dao.insertOrUpdateUser(res)

      if (!cb) return email
      cb(null, email)
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

  async enableSyncMode (space, args, cb) {
    try {
      await this.dao.checkAuthInDb(args)
      await this.dao.updateStateOf('syncMode', true)

      if (!cb) return true
      cb(null, true)
    } catch (err) {
      if (!cb) throw err
      cb(err)
    }
  }

  async disableSyncMode (space, args, cb) {
    try {
      await this.dao.checkAuthInDb(args)
      await this.dao.updateStateOf('syncMode', false)

      if (!cb) return true
      cb(null, true)
    } catch (err) {
      if (!cb) throw err
      cb(err)
    }
  }

  async isSyncModeWithDbData (space, args, cb) {
    try {
      const firstElem = await this.dao.getFirstElemInCollBy('syncMode')

      let res = !isEmpty(firstElem) && !!firstElem.isEnable

      const isSyncMode = await this.isSyncMode()

      if (isEmpty(firstElem) && isSyncMode) {
        res = true
      }

      if (!cb) return res
      cb(null, res)
    } catch (err) {
      if (!cb) return false
      cb(null, false)
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
      const firstElem = await this.dao.getFirstElemInCollBy('scheduler', { isEnable: 1 })

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
      const isSchedulerEnabled = await this.isSchedulerEnabled()
      const res = isSchedulerEnabled
        ? await getProgress(this)
        : false

      if (!cb) return res
      cb(null, res)
    } catch (err) {
      if (!cb) throw err
      cb(err)
    }
  }

  async syncNow (space, args, cb) {
    try {
      if (cb) {
        await this.dao.checkAuthInDb(args)
      }

      const res = await sync()

      if (!cb) return res
      cb(null, res)
    } catch (err) {
      if (!cb) throw err
      cb(err)
    }
  }

  /**
   * @override
   */
  async getEmail (space, args, cb) {
    if (!await this.isSyncModeWithDbData()) {
      super.getEmail(space, args, cb)

      return
    }

    try {
      const user = await this.dao.checkAuthInDb(args)

      cb(null, user.email)
    } catch (err) {
      cb(err)
    }
  }

  /**
   * @override
   */
  async getSymbols (space, args, cb) {
    if (!await this.isSyncModeWithDbData()) {
      super.getSymbols(space, args, cb)

      return
    }

    try {
      checkParams(args)

      const method = '_getSymbols'
      const { field } = getMethodCollMap().get(method)
      const symbols = await this.dao.findInCollBy(method, args)
      const pairs = collObjToArr(symbols, field)
      const res = convertPairsToCoins(pairs)

      cb(null, res)
    } catch (err) {
      cb(err)
    }
  }

  /**
   * @override
   */
  async getLedgers (space, args, cb) {
    if (!await this.isSyncModeWithDbData()) {
      super.getLedgers(space, args, cb)

      return
    }

    try {
      checkParams(args)

      const res = await this.dao.findInCollBy('_getLedgers', args)

      cb(null, res)
    } catch (err) {
      cb(err)
    }
  }

  /**
   * @override
   */
  async getTrades (space, args, cb) {
    if (!await this.isSyncModeWithDbData()) {
      super.getTrades(space, args, cb)

      return
    }

    try {
      checkParams(args)

      const res = await this.dao.findInCollBy('_getTrades', args)

      cb(null, res)
    } catch (err) {
      cb(err)
    }
  }

  /**
   * @override
   */
  async getOrders (space, args, cb) {
    if (!await this.isSyncModeWithDbData()) {
      super.getOrders(space, args, cb)

      return
    }

    try {
      checkParams(args)

      const res = await this.dao.findInCollBy('_getOrders', args)

      cb(null, res)
    } catch (err) {
      cb(err)
    }
  }

  /**
   * @override
   */
  async getMovements (space, args, cb) {
    if (!await this.isSyncModeWithDbData()) {
      super.getMovements(space, args, cb)

      return
    }

    try {
      checkParams(args)

      const res = await this.dao.findInCollBy('_getMovements', args)

      cb(null, res)
    } catch (err) {
      cb(err)
    }
  }

  /**
   * @override
   */
  async getFundingOfferHistory (space, args, cb) {
    if (!await this.isSyncModeWithDbData()) {
      super.getFundingOfferHistory(space, args, cb)

      return
    }

    try {
      checkParams(args)

      const res = await this.dao.findInCollBy('_getFundingOfferHistory', args)

      cb(null, res)
    } catch (err) {
      cb(err)
    }
  }

  /**
   * @override
   */
  async getFundingLoanHistory (space, args, cb) {
    if (!await this.isSyncModeWithDbData()) {
      super.getFundingLoanHistory(space, args, cb)

      return
    }

    try {
      checkParams(args)

      const res = await this.dao.findInCollBy('_getFundingLoanHistory', args)

      cb(null, res)
    } catch (err) {
      cb(err)
    }
  }

  /**
   * @override
   */
  async getFundingCreditHistory (space, args, cb) {
    if (!await this.isSyncModeWithDbData()) {
      super.getFundingCreditHistory(space, args, cb)

      return
    }

    try {
      checkParams(args)

      const res = await this.dao.findInCollBy('_getFundingCreditHistory', args)

      cb(null, res)
    } catch (err) {
      cb(err)
    }
  }

  _getEmail (args) {
    return promisify(super.getEmail.bind(this))(null, args)
  }

  _getLedgers (args) {
    return promisify(super.getLedgers.bind(this))(null, args)
  }

  _getTrades (args) {
    return promisify(super.getTrades.bind(this))(null, args)
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

    const email = await this._getEmail(args)

    if (!email) {
      throw new Error('ERR_AUTH_UNAUTHORIZED')
    }

    return email
  }

  /**
   * @abstract
   */
  async _databaseInitialize () {
    throw new Error('NOT_IMPLEMENTED')
  }
}

module.exports = MediatorReportService
