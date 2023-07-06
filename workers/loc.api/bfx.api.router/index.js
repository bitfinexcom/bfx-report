'use strict'

const { decorateInjectable } = require('../di/utils')

class BfxApiRouter {
  // Method does an idle job to be overridden in framework mode
  route (methodName, method) {
    return method()
  }
}

decorateInjectable(BfxApiRouter)

module.exports = BfxApiRouter
