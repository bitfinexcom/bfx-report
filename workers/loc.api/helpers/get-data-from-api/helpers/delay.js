'use strict'

const Interrupter = require('../../../interrupter')
const isInterrupted = require('./is-interrupted')

module.exports = (mc = 80000, interrupter) => {
  if (isInterrupted(interrupter)) {
    return Promise.resolve({ isInterrupted: true })
  }

  return new Promise((resolve) => {
    const hasInterrupter = interrupter instanceof Interrupter
    const timeout = setTimeout(() => {
      if (hasInterrupter) {
        interrupter.offInterrupt(onceInterruptHandler)
      }

      resolve({ isInterrupted: false })
    }, mc)
    const onceInterruptHandler = () => {
      if (!timeout.hasRef()) {
        return
      }

      clearTimeout(timeout)
      resolve({ isInterrupted: true })
    }

    if (hasInterrupter) {
      interrupter.onceInterrupt(onceInterruptHandler)
    }
  })
}
