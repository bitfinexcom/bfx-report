'use strict'

const workerInit = (_this) => {
  _this.callsDone = []
}

const workerGetPluginCtx = (_this, type, ctx) => {
  switch (type) {
    case 'api_bfx':
      ctx.callsDone = _this.callsDone
      break
  }
}

const workerArgs = ['rest:ext:testcalls', workerInit, workerGetPluginCtx]

function addFunctions (ExtApi) {
  ExtApi.prototype.addCall = function (space, call, cb) {
    this.ctx.callsDone.push(call)
    console.log('call', call)
    cb(null, { call })
  }

  ExtApi.prototype.getCalls = function (space, cb) {
    const calls = this.ctx.callsDone
    cb(null, calls)
  }

  ExtApi.prototype.clearCalls = function (space, cb) {
    this.ctx.callsDone = []
    cb(null, true)
  }
}

module.exports = {
  workerArgs,
  addFunctions
}
