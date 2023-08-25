'use strict'

const { ImplementationError } = require('../errors')
const { decorateInjectable } = require('../di/utils')

class AbstractWSEventEmitter {
  /**
   * @abstract
   */
  async emit (handler, action) { throw new ImplementationError() }

  /**
   * @abstract
   */
  async emitBfxUnamePwdAuthRequiredToOne (handler, auth) {
    throw new ImplementationError()
  }

  emitENetError (
    handler = () => {},
    action = 'emitENetError'
  ) {
    return this.emit(
      handler,
      action
    )
  }

  emitENetResumed (
    handler = () => {},
    action = 'emitENetResumed'
  ) {
    return this.emit(
      handler,
      action
    )
  }

  emitMaintenanceTurnedOn (
    handler = () => {},
    action = 'emitMaintenanceTurnedOn'
  ) {
    return this.emit(
      handler,
      action
    )
  }

  emitMaintenanceTurnedOff (
    handler = () => {},
    action = 'emitMaintenanceTurnedOff'
  ) {
    return this.emit(
      handler,
      action
    )
  }
}

decorateInjectable(AbstractWSEventEmitter)

module.exports = AbstractWSEventEmitter
