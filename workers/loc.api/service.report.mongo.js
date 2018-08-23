'use strict'

const MediatorReportService = require('./service.report.mediator')

class MongoReportService extends MediatorReportService {
  // TODO:
  async getEmail (space, args, cb) {
    if (super.getEmail(space, args, cb)) return

    cb(new Error('NOT_IMPLEMENTED'))
  }

  // TODO:
  async getSymbols (space, args, cb) {
    if (super.getSymbols(space, args, cb)) return

    cb(new Error('NOT_IMPLEMENTED'))
  }

  // TODO:
  async getLedgers (space, args, cb) {
    if (super.getLedgers(space, args, cb)) return

    cb(new Error('NOT_IMPLEMENTED'))
  }

  // TODO:
  async getTrades (space, args, cb) {
    if (super.getTrades(space, args, cb)) return

    cb(new Error('NOT_IMPLEMENTED'))
  }

  // TODO:
  async getOrders (space, args, cb) {
    if (super.getOrders(space, args, cb)) return

    cb(new Error('NOT_IMPLEMENTED'))
  }

  // TODO:
  async getMovements (space, args, cb) {
    if (super.getMovements(space, args, cb)) return

    cb(new Error('NOT_IMPLEMENTED'))
  }
}

module.exports = MongoReportService
