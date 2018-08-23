'use strict'

const { Api } = require('bfx-wrk-api')
const {
  getREST,
  getParams,
  checkParams,
  getCsvStoreStatus
} = require('./helpers')

class ReportService extends Api {
  space (service, msg) {
    const space = super.space(service, msg)
    return space
  }

  isSyncMode (space, args, cb = () => { }) {
    const wrk = this.ctx.grc_bfx.caller
    const group = wrk.group
    const conf = wrk.conf[group]

    cb(null, conf.syncMode)

    return conf.syncMode
  }

  async getEmail (space, args, cb) {
    try {
      const rest = getREST(args.auth, this.ctx.grc_bfx.caller)
      const result = await rest.userInfo()

      cb(null, result.email)
    } catch (err) {
      cb(err)
    }
  }

  lookUpFunction (space, args, cb) {
    try {
      if (typeof args.params !== 'object') {
        throw new Error('ERR_ARGS_NO_PARAMS')
      }

      const { service } = args.params
      const grape = this.ctx.grc_bfx

      grape.link.lookup(service, (err, res) => {
        const amount = (!err) ? res.length : 0

        cb(null, amount)
      })
    } catch (err) {
      cb(err)
    }
  }

  async getSymbols (space, args, cb) {
    try {
      const rest = getREST(args.auth, this.ctx.grc_bfx.caller)
      const pairs = await rest.symbols()
      const coins = []

      for (const pair in pairs) {
        const f = pairs[pair].substring(0, 3)
        if (!coins.includes(f)) coins.push(f)
        const s = pairs[pair].substring(3, 6)
        if (!coins.includes(s)) coins.push(s)
      }

      const result = { coins, pairs }

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
      checkParams(args)
      const status = await getCsvStoreStatus(this, args)

      const method = 'getTrades'

      const processorQueue = this.ctx.lokue_processor.q
      const jobData = {
        name: method,
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

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      cb(err)
    }
  }

  async getLedgersCsv (space, args, cb) {
    try {
      checkParams(args)
      const status = await getCsvStoreStatus(this, args)

      const method = 'getLedgers'

      const processorQueue = this.ctx.lokue_processor.q
      const jobData = {
        name: method,
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

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      cb(err)
    }
  }

  async getOrdersCsv (space, args, cb) {
    try {
      checkParams(args)
      const status = await getCsvStoreStatus(this, args)

      const method = 'getOrders'

      const processorQueue = this.ctx.lokue_processor.q
      const jobData = {
        name: method,
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

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      cb(err)
    }
  }

  async getMovementsCsv (space, args, cb) {
    try {
      checkParams(args)
      const status = await getCsvStoreStatus(this, args)

      const method = 'getMovements'

      const processorQueue = this.ctx.lokue_processor.q
      const jobData = {
        name: method,
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

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      cb(err)
    }
  }
}

module.exports = ReportService
