'use strict'

const Interrupter = require('../../../interrupter')

module.exports = (interrupter) => {
  return (
    interrupter instanceof Interrupter &&
    interrupter.hasInterrupted()
  )
}
