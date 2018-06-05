'use strict'

const { Api } = require('bfx-wrk-api')
const bfxFactory = require('./bfx.factory')

class ReportService extends Api {
  space (service, msg) {
    const space = super.space(service, msg)
    return space
  }

  getFundingInfo (space, args, cb) {
    if (!args.auth) return cb(new Error('ERR_ARGS_NO_AUTH_DATA'))

    const bfx = bfxFactory({ ...args.auth })
    const rest = bfx.rest(2, { transform: true })

    rest
      .fundingInfo()
      .then(res => {
        cb(null, res)
      })
      .catch(err => {
        cb(err)
      })
  }

  getLedgers (space, args, cb) {
    if (!args.auth) return cb(new Error('ERR_ARGS_NO_AUTH_DATA'))

    const params = []

    if (args.params) {
      if (typeof args.params !== 'object') {
        return cb(new Error('ERR_ARGS_NO_PARAMS'))
      }

      params.push(args.params.symbol)
    }

    const bfx = bfxFactory({ ...args.auth })
    const rest = bfx.rest(2, { transform: true })

    rest
      .ledgers(...params)
      .then(res => {
        cb(null, res)
      })
      .catch(err => {
        cb(err)
      })
  }

  getTrades (space, args, cb) {
    if (!args.auth) return cb(new Error('ERR_ARGS_NO_AUTH_DATA'))
    if (!args.params || typeof args.params !== 'object') {
      return cb(new Error('ERR_ARGS_NO_PARAMS'))
    }

    const params = [
      args.params.symbol,
      args.params.start,
      args.params.end,
      args.params.limit
    ]

    const bfx = bfxFactory({ ...args.auth })
    const rest = bfx.rest(2, { transform: true })

    rest
      .trades(...params)
      .then(res => {
        cb(null, res)
      })
      .catch(err => {
        cb(err)
      })
  }

  getOrders (space, args, cb) {
    if (!args.auth) return cb(new Error('ERR_ARGS_NO_AUTH_DATA'))
    if (!args.params || typeof args.params !== 'object') {
      return cb(new Error('ERR_ARGS_NO_PARAMS'))
    }

    const params = [
      args.params.symbol,
      args.params.start,
      args.params.end,
      args.params.limit
    ]

    const bfx = bfxFactory({ ...args.auth })
    const rest = bfx.rest(2, { transform: true })

    rest
      .orderHistory(...params)
      .then(res => {
        cb(null, res)
      })
      .catch(err => {
        cb(err)
      })
  }

  getMovements (space, args, cb) {
    if (!args.auth) return cb(new Error('ERR_ARGS_NO_AUTH_DATA'))
    if (!args.params || typeof args.params !== 'object') {
      return cb(new Error('ERR_ARGS_NO_PARAMS'))
    }

    const params = [
      args.params.symbol
    ]

    const bfx = bfxFactory({ ...args.auth })
    const rest = bfx.rest(2, { transform: true })

    rest
      .movements(...params)
      .then(res => {
        cb(null, res)
      })
      .catch(err => {
        cb(err)
      })
  }
}

module.exports = ReportService
