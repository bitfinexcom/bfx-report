'use strict'

const MediatorReportService = require('./service.report.mediator')
const { getLimitNotMoreThan } = require('./helpers')
const { getMethodCollMap } = require('./sync/helpers')

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

    if (
      !args.params ||
      typeof args.params !== 'object'
    ) {
      throw new Error('ERR_ARGS_NO_PARAMS')
    }

    try {
      const maxLimit = 5000
      const params = { ...args.params }
      params.limit = getLimitNotMoreThan(args.params.limit, maxLimit)
      const method = '_getLedgers'
      const methodColl = getMethodCollMap().get(method)
      const query = {}

      query[methodColl.dateFieldName] = {
        $gte: params.start ? params.start : 0,
        $lte: params.end ? params.end : (new Date()).getTime()
      }

      if (params.symbol) {
        query[methodColl.symbolFieldName] = params.symbol
      }

      const res = await this._getCollByName(methodColl.name)
        .find(
          query,
          {
            sort: [[methodColl.dateFieldName, -1]],
            limit: params.limit
          })
        .toArray()

      cb(null, res)
    } catch (err) {
      cb(err)
    }
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
