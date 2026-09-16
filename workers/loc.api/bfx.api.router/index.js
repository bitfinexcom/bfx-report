'use strict'

const Interrupter = require('../interrupter')
const { decorateInjectable } = require('../di/utils')

class BfxApiRouter {
  // Method does an idle job to be overridden in framework mode
  route (methodName, method, interrupter) {
    return this.execMethod(method, interrupter)
  }

  execMethod (method, interrupter) {
    if (!(interrupter instanceof Interrupter)) {
      return method()
    }
    if (interrupter.hasInterrupted()) {
      return
    }

    const res = method()

    if (!(res instanceof Promise)) {
      return res
    }

    let onceInterruptHandler = null
    const intPromise = new Promise((resolve) => {
      onceInterruptHandler = () => {
        onceInterruptHandler = null
        resolve()
      }

      interrupter.onceInterrupt(onceInterruptHandler)
    })

    return Promise.race([
      res,
      intPromise
    ]).finally(() => {
      if (typeof onceInterruptHandler !== 'function') {
        return
      }

      interrupter.offInterrupt(onceInterruptHandler)
      onceInterruptHandler()
    })
  }
}

decorateInjectable(BfxApiRouter)

module.exports = BfxApiRouter
