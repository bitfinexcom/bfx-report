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
          id: '#',
          pair: 'PAIR',
          execAmount: 'AMOUNT',
          execPrice: 'PRICE',
          fee: 'FEE',
          mtsCreate: 'DATE'
        },
        formatSettings: {
          mtsCreate: 'date',
          pair: 'symbol'
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
          description: 'DESCRIPTION',
          currency: 'CURRENCY',
          amount: 'AMOUNT',
          balance: 'BALANCE',
          mts: 'DATE'
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
          id: '#',
          symbol: 'PAIR',
          type: 'TYPE',
          amount: 'AMOUNT',
          amountOrig: 'ORIGINAL AMOUNT',
          price: 'PRICE',
          priceAvg: 'AVG PRICE',
          mtsUpdate: 'UPDATE',
          status: 'STATUS'
        },
        formatSettings: {
          mtsUpdate: 'date',
          symbol: 'symbol'
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
          id: '#',
          mtsUpdated: 'DATE',
          status: 'STATUS',
          amount: 'AMOUNT',
          destinationAddress: 'DESCRIPTION'
        },
        formatSettings: {
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
