'use strict'

const { Api } = require('bfx-wrk-api')

const {
  getREST,
  getParams,
  checkParams,
  getCsvStoreStatus,
  hasJobInQueueWithStatusBy,
  toString,
  getDateTitle
} = require('./helpers')

class ReportService extends Api {
  space (service, msg) {
    const space = super.space(service, msg)
    return space
  }

  isSyncModeConfig (space, args, cb = () => { }) {
    const wrk = this.ctx.grc_bfx.caller
    const group = wrk.group
    const conf = wrk.conf[group]

    cb(null, conf.syncMode)

    return conf.syncMode
  }

  _getUserInfo (args) {
    const rest = getREST(args.auth, this.ctx.grc_bfx.caller)

    return rest.userInfo()
  }

  async getEmail (space, args, cb) {
    try {
      const result = await this._getUserInfo(args)

      cb(null, result.email)
    } catch (err) {
      this._err(err, 'getEmail', cb)
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
      this._err(err, 'lookUpFunction', cb)
    }
  }

  async getSymbols (space, args, cb) {
    try {
      const rest = getREST({}, this.ctx.grc_bfx.caller)
      const pairs = await rest.symbols()
      const currencies = await rest.currencies()
      const result = { pairs, currencies }
      cb(null, result)
    } catch (err) {
      this._err(err, 'getSymbols', cb)
    }
  }

  _getSymbols () {
    const rest = getREST({}, this.ctx.grc_bfx.caller)

    return rest.symbols()
  }

  async getLedgers (space, args, cb) {
    try {
      const maxLimit = 5000
      const params = getParams(args, maxLimit)
      const rest = getREST(args.auth, this.ctx.grc_bfx.caller)
      const result = await rest.ledgers(...params)

      cb(null, result)
    } catch (err) {
      this._err(err, 'getLedgers', cb)
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
      this._err(err, 'getTrades', cb)
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
      this._err(err, 'getOrders', cb)
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
      this._err(err, 'getMovements', cb)
    }
  }

  async getFundingOfferHistory (space, args, cb) {
    try {
      const maxLimit = 5000
      const params = getParams(args, maxLimit)
      const rest = getREST(args.auth, this.ctx.grc_bfx.caller)
      const result = await rest.fundingOfferHistory(...params)
      cb(null, result)
    } catch (err) {
      this._err(err, 'getFundingOfferHistory', cb)
    }
  }

  async getFundingLoanHistory (space, args, cb) {
    try {
      const maxLimit = 5000
      const params = getParams(args, maxLimit)
      const rest = getREST(args.auth, this.ctx.grc_bfx.caller)
      const result = await rest.fundingLoanHistory(...params)
      cb(null, result)
    } catch (err) {
      this._err(err, 'getFundingLoanHistory', cb)
    }
  }

  async getFundingCreditHistory (space, args, cb) {
    try {
      const maxLimit = 5000
      const params = getParams(args, maxLimit)
      const rest = getREST(args.auth, this.ctx.grc_bfx.caller)
      const result = await rest.fundingCreditHistory(...params)
      cb(null, result)
    } catch (err) {
      this._err(err, 'getFundingCreditHistory', cb)
    }
  }

  async getTradesCsv (space, args, cb) {
    try {
      checkParams(args)
      const userId = await hasJobInQueueWithStatusBy(this, args)
      const status = await getCsvStoreStatus(this, args)

      const method = 'getTrades'

      const processorQueue = this.ctx.lokue_processor.q
      const jobData = {
        userId,
        name: method,
        args,
        propNameForPagination: 'mtsCreate',
        columnsCsv: {
          id: '#',
          orderID: 'ORDER ID',
          symbol: 'PAIR',
          execAmount: 'AMOUNT',
          execPrice: 'PRICE',
          fee: 'FEE',
          mtsCreate: getDateTitle(args)
        },
        formatSettings: {
          mtsCreate: 'date',
          symbol: 'symbol'
        }
      }

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getTradesCsv', cb)
    }
  }

  async getLedgersCsv (space, args, cb) {
    try {
      checkParams(args)
      const userId = await hasJobInQueueWithStatusBy(this, args)
      const status = await getCsvStoreStatus(this, args)

      const method = 'getLedgers'

      const processorQueue = this.ctx.lokue_processor.q
      const jobData = {
        userId,
        name: method,
        args,
        propNameForPagination: 'mts',
        columnsCsv: {
          description: 'DESCRIPTION',
          wallet: 'WALLET',
          currency: 'CURRENCY',
          credit: 'CREDIT',
          debit: 'DEBIT',
          balance: 'BALANCE',
          mts: getDateTitle(args)
        },
        formatSettings: {
          mts: 'date'
        }
      }

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getLedgersCsv', cb)
    }
  }

  async getOrdersCsv (space, args, cb) {
    try {
      checkParams(args)
      const userId = await hasJobInQueueWithStatusBy(this, args)
      const status = await getCsvStoreStatus(this, args)

      const method = 'getOrders'

      const processorQueue = this.ctx.lokue_processor.q
      const jobData = {
        userId,
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
          mtsUpdate: getDateTitle(args, 'UPDATE'),
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
      this._err(err, 'getOrdersCsv', cb)
    }
  }

  async getMovementsCsv (space, args, cb) {
    try {
      checkParams(args)
      const userId = await hasJobInQueueWithStatusBy(this, args)
      const status = await getCsvStoreStatus(this, args)

      const method = 'getMovements'

      const processorQueue = this.ctx.lokue_processor.q
      const jobData = {
        userId,
        name: method,
        args,
        propNameForPagination: 'mtsUpdated',
        columnsCsv: {
          id: '#',
          mtsUpdated: getDateTitle(args),
          currency: 'CURRENCY',
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
      this._err(err, 'getMovementsCsv', cb)
    }
  }

  async getFundingOfferHistoryCsv (space, args, cb) {
    try {
      checkParams(args)
      const userId = await hasJobInQueueWithStatusBy(this, args)
      const status = await getCsvStoreStatus(this, args)

      const method = 'getFundingOfferHistory'

      const processorQueue = this.ctx.lokue_processor.q
      const jobData = {
        userId,
        name: method,
        args,
        propNameForPagination: 'mtsUpdate',
        columnsCsv: {
          id: '#',
          symbol: 'CURRENCY',
          amount: 'AMOUNT',
          amountOrig: 'ORIGINAL AMOUNT',
          type: 'TYPE',
          status: 'STATUS',
          rate: 'RATE(% PER DAY)',
          period: 'PERIOD',
          mtsUpdate: getDateTitle(args)
        },
        formatSettings: {
          mtsUpdate: 'date',
          symbol: 'symbol'
        }
      }

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getFundingOfferHistoryCsv', cb)
    }
  }

  async getFundingLoanHistoryCsv (space, args, cb) {
    try {
      checkParams(args)
      const userId = await hasJobInQueueWithStatusBy(this, args)
      const status = await getCsvStoreStatus(this, args)

      const method = 'getFundingLoanHistory'

      const processorQueue = this.ctx.lokue_processor.q
      const jobData = {
        userId,
        name: method,
        args,
        propNameForPagination: 'mtsUpdate',
        columnsCsv: {
          id: '#',
          symbol: 'CURRENCY',
          side: 'SIDE',
          amount: 'AMOUNT',
          status: 'STATUS',
          rate: 'RATE(% PER DAY)',
          period: 'PERIOD',
          mtsOpening: getDateTitle(args, 'OPENED'),
          mtsLastPayout: getDateTitle(args, 'CLOSED'),
          mtsUpdate: getDateTitle(args)
        },
        formatSettings: {
          side: 'side',
          mtsUpdate: 'date',
          mtsOpening: 'date',
          mtsLastPayout: 'date',
          symbol: 'symbol'
        }
      }

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getFundingLoanHistoryCsv', cb)
    }
  }

  async getFundingCreditHistoryCsv (space, args, cb) {
    try {
      checkParams(args)
      const userId = await hasJobInQueueWithStatusBy(this, args)
      const status = await getCsvStoreStatus(this, args)

      const method = 'getFundingCreditHistory'

      const processorQueue = this.ctx.lokue_processor.q
      const jobData = {
        userId,
        name: method,
        args,
        propNameForPagination: 'mtsUpdate',
        columnsCsv: {
          id: '#',
          symbol: 'CURRENCY',
          side: 'SIDE',
          amount: 'AMOUNT',
          status: 'STATUS',
          rate: 'RATE(% PER DAY)',
          period: 'PERIOD',
          mtsOpening: getDateTitle(args, 'OPENED'),
          mtsLastPayout: getDateTitle(args, 'CLOSED'),
          positionPair: 'POSITION PAIR',
          mtsUpdate: getDateTitle(args)
        },
        formatSettings: {
          side: 'side',
          mtsUpdate: 'date',
          mtsOpening: 'date',
          mtsLastPayout: 'date',
          symbol: 'symbol'
        }
      }

      processorQueue.addJob(jobData)

      cb(null, status)
    } catch (err) {
      this._err(err, 'getFundingCreditHistoryCsv', cb)
    }
  }

  _err (err, caller, cb) {
    const options = toString(err.options)
    const logTxtErr = `
    function: ${caller}
    statusCode: ${err.statusCode}
    name: ${err.name}
    message: ${err.message}
    options: ${options}

    `
    const logger = this.ctx.grc_bfx.caller.logger
    logger.error(logTxtErr)
    cb(err)
  }
}

module.exports = ReportService
