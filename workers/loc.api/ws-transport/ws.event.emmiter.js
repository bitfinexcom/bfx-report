'use strict'

let deps = {}

class WSEventEmmiter {
  constructor (inDeps) {
    this.deps = { ...deps, ...inDeps }
  }

  static inject (inDeps) {
    deps = { ...deps, ...inDeps }
  }

  emmitProgress (handler = () => {}) {
    return this.deps.wsTransport.send(handler, 'progress')
  }
}

module.exports = WSEventEmmiter
