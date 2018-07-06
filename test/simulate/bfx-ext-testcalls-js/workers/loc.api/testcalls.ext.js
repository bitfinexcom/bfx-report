'use strict'

const { Api } = require('bfx-wrk-api')

class ExtTestcalls extends Api {
  space (service, msg) {
    const space = super.space(service, msg)
    return space
  }

  addCall (space, call, cb) {
    this.ctx.callsDone.push(call)
    cb(null, {call})
  }

  getCalls (space, cb) {
    const calls = this.ctx.callsDone
    cb(null, calls)
  }

  clearCalls (space, cb) {
    this.ctx.callsDone = []
    cb(null, true)
  }
}

module.exports = ExtTestcalls
