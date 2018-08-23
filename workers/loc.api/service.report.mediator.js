'use strict'

const ReportService = require('./service.report')

class MediatorReportService extends ReportService {
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
      const wrk = this.ctx.grc_bfx.caller
      const job = wrk.scheduler_sync.mem.get('sync')
      const res = job.reschedule(job.rule)

      cb(null, res)
    } catch (err) {
      cb(err)
    }
  }

  disableScheduler (space, args, cb) {
    try {
      const wrk = this.ctx.grc_bfx.caller
      const job = wrk.scheduler_sync.mem.get('sync')

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
}

module.exports = MediatorReportService
