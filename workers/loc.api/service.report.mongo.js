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

  _getCollByName (name) {
    const db = this.ctx.dbMongo_m0.db

    return db.collection(name)
  }

  async _createIndex () {
    await this._getCollByName('trades').createIndex({ 'mtsCreate': -1, 'pair': 1 })
    await this._getCollByName('ledgers').createIndex({ 'mts': -1, 'currency': 1 })
    await this._getCollByName('orders').createIndex({ 'mtsUpdate': -1, 'symbol': 1 })
    await this._getCollByName('movements').createIndex({ 'mtsUpdated': -1, 'currency': 1 })
  }

  async _getLastElemFromDb (name, dateFieldName) {
    return this._getCollByName(name).findOne({ }, { sort: [[dateFieldName, -1]] })
  }

  async _insertElemsToDb (name, data = []) {
    return this._getCollByName(name).insertMany(data, { ordered: true })
  }
}

module.exports = MongoReportService
