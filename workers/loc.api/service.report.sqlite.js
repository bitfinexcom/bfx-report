'use strict'

const ReportService = require('./service.report')

class SqliteReportService extends ReportService {
  getEmail (space, args, cb) {
    // TODO:
    super.getEmail(space, args, cb)
  }

  getSymbols (space, args, cb) {
    // TODO:
    super.getSymbols(space, args, cb)
  }

  getFundingInfo (space, args, cb) {
    cb(null, true)
  }

  getLedgers (space, args, cb) {
    // TODO:
    super.getLedgers(space, args, cb)
  }

  async getTrades (space, args, cb) {
    // TODO:
    super.getTrades(space, args, cb)
  }

  async getOrders (space, args, cb) {
    // TODO:
    super.getOrders(space, args, cb)
  }

  async getMovements (space, args, cb) {
    // TODO:
    super.getMovements(space, args, cb)
  }
}

module.exports = SqliteReportService
