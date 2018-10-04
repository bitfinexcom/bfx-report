'use strict'

const { promisify } = require('util')
const { isEmpty, pick } = require('lodash')

const ReportService = require('./service.report')
const {
  checkParams,
  checkParamsAuth,
  convertPairsToCoins,
  isAuthError,
  isEnotfoundError,
  isEaiAgainError
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
      let email = null

      try {
        email = await this._checkAuthInApi(args)
      } catch (err) {
        if (isAuthError(err)) {
          throw err
        }
      }

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
      await this.dao.updateUserByAuth({
        ...pick(args.auth, ['apiKey', 'apiSecret']),
        isDataFromDb: 1
      })

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

      let res = !isEmpty(firstElem) &&
        !isEmpty(user) &&
        !!firstElem.isEnable &&
        user.isDataFromDb

      const isSyncMode = await this.isSyncModeConfig()

      if (
        isEmpty(firstElem) &&
        isSyncMode &&
        !isEmpty(user) &&
        user.isDataFromDb
      ) {
        res = true
      }

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
  async getSymbols (space, args, cb) {
    try {
      if (!await this.isSyncModeWithDbData(space, args)) {
        super.getSymbols(space, args, cb)

        return
      }

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
    try {
      if (!await this.isSyncModeWithDbData(space, args)) {
        super.getLedgers(space, args, cb)

        return
      }

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
    try {
      if (!await this.isSyncModeWithDbData(space, args)) {
        super.getTrades(space, args, cb)

        return
      }

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
    try {
      if (!await this.isSyncModeWithDbData(space, args)) {
        super.getOrders(space, args, cb)

        return
      }

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
    try {
      if (!await this.isSyncModeWithDbData(space, args)) {
        super.getMovements(space, args, cb)

        return
      }

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
    try {
      if (!await this.isSyncModeWithDbData(space, args)) {
        super.getFundingOfferHistory(space, args, cb)

        return
      }

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
    try {
      if (!await this.isSyncModeWithDbData(space, args)) {
        super.getFundingLoanHistory(space, args, cb)

        return
      }

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
    try {
      if (!await this.isSyncModeWithDbData(space, args)) {
        super.getFundingCreditHistory(space, args, cb)

        return
      }

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
