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

  async _createIndex () {
    const db = this.ctx.dbMongo_m0.db

    await db.collection('trades').createIndex({ 'mtsCreate': -1, 'pair': 1 })
    await db.collection('ledgers').createIndex({ 'mts': -1, 'currency': 1 })
    await db.collection('orders').createIndex({ 'mtsUpdate': -1, 'symbol': 1 })
    await db.collection('movements').createIndex({ 'mtsUpdated': -1, 'currency': 1 })
  }

  async _getLastElemFromDb (name, dateFieldName) {
    const db = this.ctx.dbMongo_m0.db

    return db.collection(name).findOne({ }, { sort: [[dateFieldName, -1]] })
  }
}

module.exports = MongoReportService
