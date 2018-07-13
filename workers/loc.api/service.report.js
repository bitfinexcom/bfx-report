'use strict'

const { Api } = require('bfx-wrk-api')
const {
  getREST,
  getLimitNotMoreThan,
  checkArgsAndAuth,
  isAllowMethod
} = require('./helpers')

const jobOpts = {
  attempts: 10,
  backoff: {
    type: 'fixed',
    delay: 60000
  },
  timeout: 1200000
}

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

      const rest = getREST(args.auth, this.ctx.grc_bfx.caller)
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
        getLimitNotMoreThan(args.params.limit),
        args.params.sort
      ]

      const rest = getREST(args.auth, this.ctx.grc_bfx.caller)
      const result = await rest.accountTrades(...params)

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

      const rest = getREST(args.auth, this.ctx.grc_bfx.caller)
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

      await checkArgsAndAuth(args, this[method].bind(this))

      const processorQueue = this.ctx.bull_processor.queue
      const jobData = {}

      await processorQueue.add(method, jobData, jobOpts)

      cb(null, true)
    } catch (err) {
      cb(err)
    }
  }

  async getLedgersCsv (space, args, cb) {
    try {
      isAllowMethod(this.ctx)

      const method = 'getLedgers'

      await checkArgsAndAuth(args, this[method].bind(this))

      const processorQueue = this.ctx.bull_processor.queue
      const jobData = {}

      await processorQueue.add(method, jobData, jobOpts)

      cb(null, true)
    } catch (err) {
      cb(err)
    }
  }

  async getOrdersCsv (space, args, cb) {
    try {
      isAllowMethod(this.ctx)

      const method = 'getOrders'

      await checkArgsAndAuth(args, this[method].bind(this))

      const processorQueue = this.ctx.bull_processor.queue
      const jobData = {}

      await processorQueue.add(method, jobData, jobOpts)

      cb(null, true)
    } catch (err) {
      cb(err)
    }
  }

  async getMovementsCsv (space, args, cb) {
    try {
      isAllowMethod(this.ctx)

      const method = 'getMovements'

      await checkArgsAndAuth(args, this[method].bind(this))

      const processorQueue = this.ctx.bull_processor.queue
      const jobData = {}

      await processorQueue.add(method, jobData, jobOpts)

      cb(null, true)
    } catch (err) {
      cb(err)
    }
  }
}

module.exports = ReportService
