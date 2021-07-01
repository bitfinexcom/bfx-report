'use strict'

const {
  GrcSlackAvailabilityError
} = require('../errors')

let _loggerDeps = {
  grcSlackFac: {
    logError () {
      return Promise
        .reject(new GrcSlackAvailabilityError())
    }
  },
  hasGrcService: {
    hasSlackService () {}
  }
}

const setLoggerDeps = (deps = {}) => {
  _loggerDeps = {
    ..._loggerDeps,
    ...deps
  }
}

const getLoggerDeps = () => {
  return _loggerDeps
}

module.exports = {
  setLoggerDeps,
  getLoggerDeps
}
