'use strict'

const { Api } = require('bfx-wrk-api')
const {
  getREST,
  getParams,
  isAllowMethod
} = require('./helpers')

class ReportService extends Api {
  space (service, msg) {
    const space = super.space(service, msg)
    return space
  }

  async getFundingInfo (space, args, cb) {
    try {
      const rest = getREST(args.auth, this.ctx.grc_bfx.caller)
      const result = await rest.fundingInfo()

      cb(null, result)
    } catch (err) {
      cb(err)
    }
  }

  async getLedgers (space, args, cb) {
    try {
      const maxLimit = 5000
      const params = getParams(args, maxLimit)
      const rest = getREST(args.auth, this.ctx.grc_bfx.caller)
      const result = await rest.ledgers(...params)

      cb(null, result)
    } catch (err) {
      cb(err)
    }
  }

  async getTrades (space, args, cb) {
    try {
      const maxLimit = 1500
      const params = getParams(args, maxLimit)
      const rest = getREST(args.auth, this.ctx.grc_bfx.caller)
      const result = await rest.accountTrades(...params)

      cb(null, result)
    } catch (err) {
      cb(err)
    }
  }

  async getOrders (space, args, cb) {
    try {
      const maxLimit = 5000
      const params = getParams(args, maxLimit)
      const rest = getREST(args.auth, this.ctx.grc_bfx.caller)
      const result = await rest.orderHistory(...params)

      cb(null, result)
    } catch (err) {
      cb(err)
    }
  }

  async getMovements (space, args, cb) {
    try {
      const maxLimit = 25
      const params = getParams(args, maxLimit)
      const rest = getREST(args.auth, this.ctx.grc_bfx.caller)
      const result = await rest.movements(...params)
      cb(null, result)
    } catch (err) {
      cb(err)
    }
  }

  async getTradesCsv (space, args, cb) {
    try {
      isAllowMethod(this.ctx)

      const method = 'getTrades'

      const processorQueue = this.ctx.bull_processor.queue
      const jobData = {
        args,
        propNameForPagination: 'mtsCreate',
        columnsCsv: {
          id: 'ID',
          pair: 'Pair',
          mtsCreate: 'Date',
          execAmount: 'Amount',
          execPrice: 'Price',
          fee: 'Fee',
          feeCurrency: 'Fee currency'
        },
        formatSettings: {
          mtsCreate: 'date'
        }
      }

      await processorQueue.add(method, jobData)

      cb(null, true)
    } catch (err) {
      cb(err)
    }
  }

  async getLedgersCsv (space, args, cb) {
    try {
      isAllowMethod(this.ctx)

      const method = 'getLedgers'

      const processorQueue = this.ctx.bull_processor.queue
      const jobData = {
        args,
        propNameForPagination: 'mts',
        columnsCsv: {
          id: 'ID',
          currency: 'Currency',
          mts: 'Date',
          amount: 'Amount',
          balance: 'Balance',
          description: 'Description'
        },
        formatSettings: {
          mts: 'date'
        }
      }

      await processorQueue.add(method, jobData)

      cb(null, true)
    } catch (err) {
      cb(err)
    }
  }

  async getOrdersCsv (space, args, cb) {
    try {
      isAllowMethod(this.ctx)

      const method = 'getOrders'

      const processorQueue = this.ctx.bull_processor.queue
      const jobData = {
        args,
        propNameForPagination: 'mtsUpdate',
        columnsCsv: {
          id: 'ID',
          symbol: 'Symbol',
          mtsCreate: 'Create',
          mtsUpdate: 'Update',
          amountOrig: 'Amount',
          type: 'Type',
          status: 'Status',
          price: 'Price',
          priceAvg: 'Avg price'
        },
        formatSettings: {
          mtsCreate: 'date',
          mtsUpdate: 'date'
        }
      }

      await processorQueue.add(method, jobData)

      cb(null, true)
    } catch (err) {
      cb(err)
    }
  }

  async getMovementsCsv (space, args, cb) {
    try {
      isAllowMethod(this.ctx)

      const method = 'getMovements'

      const processorQueue = this.ctx.bull_processor.queue
      const jobData = {
        args,
        propNameForPagination: 'mtsUpdated',
        columnsCsv: {
          id: 'ID',
          currency: 'Currency',
          mtsStarted: 'Started',
          mtsUpdated: 'Updated',
          status: 'Status',
          amount: 'Amount',
          destinationAddress: 'Destination'
        },
        formatSettings: {
          mtsStarted: 'date',
          mtsUpdated: 'date'
        }
      }

      await processorQueue.add(method, jobData)

      cb(null, true)
    } catch (err) {
      cb(err)
    }
  }
}

module.exports = ReportService
