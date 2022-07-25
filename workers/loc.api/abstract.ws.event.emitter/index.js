'use strict'

const { ImplementationError } = require('../errors')
const { decorateInjectable } = require('../di/utils')

class AbstractWSEventEmitter {
  /**
   * @abstract
   */
  async emit (handler, action) { throw new ImplementationError() }

  emitENetError (
    handler = () => {},
    action = 'emitENetError'
  ) {
    return this.emit(
      handler,
      action
    )
  }
}

decorateInjectable(AbstractWSEventEmitter)

module.exports = AbstractWSEventEmitter
