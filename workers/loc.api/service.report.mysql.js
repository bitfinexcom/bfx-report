'use strict'

const ReportService = require('./service.report')

class MysqlReportService extends ReportService {
  // TODO:
  async getEmail (space, args, cb) {
    super.getEmail(space, args, cb)
  }

  // TODO:
  async getSymbols (space, args, cb) {
    super.getSymbols(space, args, cb)
  }

  // TODO:
  getLedgers (space, args, cb) {
    super.getLedgers(space, args, cb)
  }

  // TODO:
  async getTrades (space, args, cb) {
    super.getTrades(space, args, cb)
  }

  // TODO:
  async getOrders (space, args, cb) {
    super.getOrders(space, args, cb)
  }

  // TODO:
  async getMovements (space, args, cb) {
    super.getMovements(space, args, cb)
  }
}

module.exports = MysqlReportService
