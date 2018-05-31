'use strict'

const { Api } = require('bfx-wrk-api')
const bfxFactory = require('./bfx.factory')

class ReportService extends Api {
  space(service, msg) {
    const space = super.space(service, msg)
    return space
  }

  accountInfo(space, args, cb) {
    if (!args.auth) return cb(new Error('ERR_ARGS_NO_AUTH_DATA'))

    const bfx = bfxFactory({ ...args.auth })
    const rest = bfx.rest(2, { transform: true })

    rest
      .accountInfo()
      .then(res => {
        cb(null, res)
      })
      .catch(err => {
        cb(err)
      })
  }

  orderHistory(space, args, cb) {
    if (!args.auth) return cb(new Error('ERR_ARGS_NO_AUTH_DATA'))
    if (!args.params && typeof args.params !== 'object') {
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
}

module.exports = ReportService
