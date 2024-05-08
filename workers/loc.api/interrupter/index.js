'use strict'

const EventEmitter = require('events')

const { decorateInjectable } = require('../di/utils')

class Interrupter extends EventEmitter {
  constructor () {
    super()

    this.INTERRUPT_EVENT = 'INTERRUPT_EVENT'
    this.INTERRUPTED_EVENT = 'INTERRUPTED_EVENT'
    this.INTERRUPTED_WITH_ERR_EVENT = 'ERR_INTERRUPTED_WITH_ERR_EVENT'

    this._isInterrupted = false
    this._interruptPromise = Promise.resolve()
  }

  hasInterrupted () {
    return this._isInterrupted
  }

  interrupt () {
    if (this._isInterrupted) {
      return this._interruptPromise
    }

    this._isInterrupted = true
    this._interruptPromise = new Promise((resolve, reject) => {
      try {
        this.emit(this.INTERRUPT_EVENT)

        const errorHandler = (err) => {
          this.off(this.INTERRUPTED_EVENT, progressHandler)
          this._isInterrupted = false

          reject(err)
        }
        const progressHandler = (progress) => {
          this.off(this.INTERRUPTED_WITH_ERR_EVENT, errorHandler)
          this._isInterrupted = false

          resolve(progress)
        }

        this.once(this.INTERRUPTED_WITH_ERR_EVENT, errorHandler)
        this.once(this.INTERRUPTED_EVENT, progressHandler)
      } catch (err) {
        this._isInterrupted = false

        reject(err)
      }
    })

    return this._interruptPromise
  }

  onceInterrupt (cb) {
    this.once(this.INTERRUPT_EVENT, cb)
  }

  offInterrupt (cb) {
    this.off(this.INTERRUPT_EVENT, cb)
  }

  onceInterrupted (cb) {
    this.once(this.INTERRUPTED_EVENT, cb)
  }

  emitInterrupted (error, progress) {
    if (error) {
      this.emit(this.INTERRUPTED_WITH_ERR_EVENT, error)

      return
    }

    this.emit(this.INTERRUPTED_EVENT, progress)
  }
}

decorateInjectable(Interrupter)

module.exports = Interrupter
