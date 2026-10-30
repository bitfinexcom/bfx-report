'use strict'

const Interrupter = require('../interrupter')

class Context {
  interrupter = null

  setInterrupter (interrupter) {
    this.interrupter = interrupter
  }

  getInterrupter () {
    return this.interrupter
  }

  rmInterrupter () {
    this.interrupter = null
  }

  hasInterrupter () {
    return this.interrupter instanceof Interrupter
  }
}

module.exports = Context
