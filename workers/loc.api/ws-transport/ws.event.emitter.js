'use strict'

let deps = {}

class WSEventEmitter {
  constructor (inDeps) {
    this.deps = { ...deps, ...inDeps }
  }

  static inject (inDeps) {
    deps = { ...deps, ...inDeps }
  }

  emitProgress (handler = () => {}) {
    return this.deps.wsTransport.send(
      handler,
      'emitProgress',
      { deps: this.deps }
    )
  }
}

module.exports = WSEventEmitter
