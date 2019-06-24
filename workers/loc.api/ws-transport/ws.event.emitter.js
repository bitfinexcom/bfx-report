'use strict'

let deps = {}

class WSEventEmitter {
  constructor (inDeps) {
    this.deps = { ...deps, ...inDeps }
  }

  static inject (inDeps) {
    deps = { ...deps, ...inDeps }
  }

  isInvalidAuth (args = {}, { apiKey, apiSecret } = {}) {
    const { auth = {} } = { ...args }

    return (
      auth.apiKey !== apiKey ||
      auth.apiSecret !== apiSecret
    )
  }

  emitProgress (handler = () => {}) {
    return this.deps.wsTransport.sendToActiveUsers(
      handler,
      'emitProgress',
      { deps: this.deps }
    )
  }

  async emitRedirectingRequestsStatusToApi (handler = () => {}) {
    return this.deps.wsTransport.sendToActiveUsers(
      handler,
      'emitRedirectingRequestsStatusToApi',
      { deps: this.deps }
    )
  }
}

module.exports = WSEventEmitter
