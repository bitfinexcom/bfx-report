'use strict'

const { Api } = require('bfx-wrk-api')
const { getREST, getLimitNotMoreThan } = require('./helpers')
const { promisify } = require('util')

class ReportService extends Api {
  space (service, msg) {
    const space = super.space(service, msg)
    return space
  }

  async getFundingInfo (space, args, cb) {
    try {
      const rest = getREST(args.auth)
      const result = await rest.fundingInfo()

      cb(null, result)
    } catch (err) {
      cb(err)
    }
  }

  async getLedgers (space, args, cb) {
    try {
      const params = []

      if (args.params) {
        if (typeof args.params !== 'object') {
          throw new Error('ERR_ARGS_NO_PARAMS')
        }

        params.push(
          ...[
            args.params.symbol,
            args.params.start,
            args.params.end,
            getLimitNotMoreThan(args.params.limit)
          ]
        )
      }

      const rest = getREST(args.auth)
      const result = await rest.ledgers(...params)

      cb(null, result)
    } catch (err) {
      cb(err)
    }
  }

  async getTrades (space, args, cb) {
    try {
      if (!args.params || typeof args.params !== 'object') {
        throw new Error('ERR_ARGS_NO_PARAMS')
      }

      const params = [
        args.params.symbol,
        args.params.start,
        args.params.end,
        getLimitNotMoreThan(args.params.limit)
      ]

      const rest = getREST(args.auth)
      const result = await rest.trades(...params)

      cb(null, result)
    } catch (err) {
      cb(err)
    }
  }

  async getOrders (space, args, cb) {
    try {
      if (!args.params || typeof args.params !== 'object') {
        throw new Error('ERR_ARGS_NO_PARAMS')
      }

      const params = [
        args.params.symbol,
        args.params.start,
        args.params.end,
        getLimitNotMoreThan(args.params.limit)
      ]

      const rest = getREST(args.auth)
      const result = await rest.orderHistory(...params)

      cb(null, result)
    } catch (err) {
      cb(err)
    }
  }

  async getMovements (space, args, cb) {
    try {
      const params = []

      if (args.params) {
        if (typeof args.params !== 'object') {
          throw new Error('ERR_ARGS_NO_PARAMS')
        }

        params.push(
          ...[
            args.params.symbol,
            args.params.start,
            args.params.end,
            getLimitNotMoreThan(args.params.limit)
          ]
        )
      }

      const rest = getREST(args.auth)
      const result = await rest.movements(...params)

      cb(null, result)
    } catch (err) {
      cb(err)
    }
  }

  // TODO: 
  async getTradesCsv (space, args, cb) {
    try {
      if (!args.params || typeof args.params !== 'object') {
        throw new Error('ERR_ARGS_NO_PARAMS')
      }

      args.params.limit = 1000
      args.params.start = null
      args.params.end = null

      const result = await this._getFullData('getTrades', args)

      cb(null, result)
    } catch (err) {
      cb(err)
    }
  }

  // TODO: 
  async _getFullData (method, args, propName = 'mts') {
    if (typeof this[method] !== 'function') {
      throw new Error('ERR_METHOD_NOT_FOUND')
    }

    const data = []
    const getData = promisify(this[method])
    const res = await getData(null, args)

    data.push(...res)

    if (
      data &&
      Array.isArray(data) &&
      data.length > 0 &&
      typeof data[data.length - 1] === 'object' &&
      data[data.length - 1][propName] &&
      Number.isInteger(data[data.length - 1][propName])
    ) {
      console.log('---Data length---', data.length)
      args.params.end = data[data.length - 1][propName] - 1

      const subRes = await this._getFullData(method, args, propName)

      data.push(...subRes)
    }

    console.log('---Total data length---', data.length)
    return data
  }
}

module.exports = ReportService
