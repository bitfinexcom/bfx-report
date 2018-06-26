'use strict'

const { Api } = require('bfx-wrk-api')
const { getREST, getLimitNotMoreThan } = require('./helpers')

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
      args.params.start = undefined
      args.params.end = undefined

      const columns = {
        id: 'ID',
        mts: 'Time',
        amount: 'Amount',
        price: 'Price'
      }

      const processorQueue = this.ctx.bull_processor.queue

      await processorQueue.add({
        method: 'getTrades',
        args,
        propName: 'mts',
        columns
      })

      cb(null, true)
    } catch (err) {
      cb(err)
    }
  }

  // TODO: 
  async getLedgersCsv (space, args, cb) {
    try {
      if (!args.params || typeof args.params !== 'object') {
        throw new Error('ERR_ARGS_NO_PARAMS')
      }

      args.params.limit = 5000
      args.params.start = undefined
      args.params.end = undefined

      const columns = {
        id: 'ID',
        mts: 'Time',
        currency: 'Currency',
        amount: 'Amount',
        balance: 'Balance'
      }

      const processorQueue = this.ctx.bull_processor.queue

      await processorQueue.add({
        method: 'getLedgers',
        args,
        propName: 'mts',
        columns
      })

      cb(null, true)
    } catch (err) {
      cb(err)
    }
  }

  // TODO: 
  async getOrdersCsv (space, args, cb) {
    try {
      if (!args.params || typeof args.params !== 'object') {
        throw new Error('ERR_ARGS_NO_PARAMS')
      }

      args.params.limit = 5000
      args.params.start = undefined
      args.params.end = undefined // TODO:

      const columns = {
        id: 'ID',
        symbol: 'Symbol',
        type: 'Type',
        price: 'Price',
        priceAvg: 'Avg price',
        mtsUpdate: 'Update',
        status: 'Status'
      }

      const processorQueue = this.ctx.bull_processor.queue

      await processorQueue.add({
        method: 'getOrders',
        args,
        propName: 'mtsUpdate',
        columns
      })

      cb(null, true)
    } catch (err) {
      cb(err)
    }
  }

  // TODO: 
  async getMovementsCsv (space, args, cb) {
    try {
      if (!args.params || typeof args.params !== 'object') {
        throw new Error('ERR_ARGS_NO_PARAMS')
      }

      args.params.limit = 25
      args.params.start = undefined
      args.params.end = undefined

      const columns = {
        id: 'ID',
        mtsStarted: 'Started',
        mtsUpdated: 'Updated',
        currency: 'Currency',
        amount: 'Amount',
        status: 'Status',
        destinationAddress: 'Destination'
      }

      const processorQueue = this.ctx.bull_processor.queue

      await processorQueue.add({
        method: 'getMovements',
        args,
        propName: 'mtsUpdated',
        columns
      })

      cb(null, true)
    } catch (err) {
      cb(err)
    }
  }
}

module.exports = ReportService
