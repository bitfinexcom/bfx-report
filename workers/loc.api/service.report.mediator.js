'use strict'

const { isEmpty } = require('lodash')

const ReportService = require('./service.report')
const { checkParamsAuth } = require('./helpers')
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
      sync().then(() => {}).catch(() => {})

      if (!cb) return true
      cb(null, true)
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

  async isEnableScheduler (space, args, cb) {
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

  async getSyncProgress (space, args, cb = () => { }) {
    const wrk = this.ctx.grc_bfx.caller
    const isEnableScheduler = await this.isEnableScheduler()

    cb(null, isEnableScheduler ? wrk.syncProgress : false)
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
