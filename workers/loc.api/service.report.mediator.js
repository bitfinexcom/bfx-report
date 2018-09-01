'use strict'

const { promisify } = require('util')

const ReportService = require('./service.report')
const {
  addAuth,
  removeAuth
} = require('./sync/helpers')

class MediatorReportService extends ReportService {
  // TODO:
  async login (space, args, cb = () => { }) {
    try {
      const email = await this._checkAuth(args)

      const res = {
        email,
        auth: { ...args.auth }
      }

      addAuth(this, args.auth)
      cb(null, res)

      return res
    } catch (err) {
      cb(err)

      throw err
    }
  }

  // TODO:
  async logout (space, args, cb) {
    try {
      await this._checkAuth(args)

      removeAuth(this, args.auth.apiKey)
      cb(null, true)

      return true
    } catch (err) {
      cb(err)

      throw err
    }
  }

  enableSyncMode (space, args, cb) {
    const wrk = this.ctx.grc_bfx.caller
    const group = wrk.group
    wrk.conf[group].syncMode = true

    this.enableScheduler(space, args, cb)
  }

  disableSyncMode (space, args, cb) {
    const wrk = this.ctx.grc_bfx.caller
    const group = wrk.group
    wrk.conf[group].syncMode = false

    this.disableScheduler(space, args, cb)
  }

  enableScheduler (space, args, cb) {
    try {
      const job = this.ctx.scheduler_sync.mem.get('sync')
      const res = job.reschedule(job.rule)

      cb(null, res)
    } catch (err) {
      cb(err)
    }
  }

  disableScheduler (space, args, cb) {
    try {
      const job = this.ctx.scheduler_sync.mem.get('sync')

      job.once('canceled', () => {
        cb(null, true)
      })

      job.cancel(true)
    } catch (err) {
      cb(err)
    }
  }

  getSyncProgress (space, args, cb = () => { }) {
    const wrk = this.ctx.grc_bfx.caller
    const isSyncMode = this.isSyncMode()

    cb(null, isSyncMode ? wrk.syncProgress : false)
  }

  getEmail (space, args, cb) {
    if (!this.isSyncMode()) {
      super.getEmail(space, args, cb)

      return true
    }

    return false
  }

  getSymbols (space, args, cb) {
    if (!this.isSyncMode()) {
      super.getSymbols(space, args, cb)

      return true
    }

    return false
  }

  getLedgers (space, args, cb) {
    if (!this.isSyncMode()) {
      super.getLedgers(space, args, cb)

      return true
    }

    return false
  }

  getTrades (space, args, cb) {
    if (!this.isSyncMode()) {
      super.getTrades(space, args, cb)

      return true
    }

    return false
  }

  getOrders (space, args, cb) {
    if (!this.isSyncMode()) {
      super.getOrders(space, args, cb)

      return true
    }

    return false
  }

  getMovements (space, args, cb) {
    if (!this.isSyncMode()) {
      super.getMovements(space, args, cb)

      return true
    }

    return false
  }

  _getEmail (args) {
    return promisify(super.getEmail.bind(this))(null, args)
  }

  _getSymbols (args) {
    return promisify(super.getSymbols.bind(this))(null, args)
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

  async _checkAuth (args) {
    if (
      typeof args.auth !== 'object' ||
      typeof args.auth.apiKey !== 'string' ||
      typeof args.auth.apiSecret !== 'string'
    ) {
      throw new Error('ERR_AUTH_UNAUTHORIZED')
    }

    const email = await this._getEmail(args)

    if (!email) {
      throw new Error('ERR_AUTH_UNAUTHORIZED')
    }

    return email
  }
}

module.exports = MediatorReportService
