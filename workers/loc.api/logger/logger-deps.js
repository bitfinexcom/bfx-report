'use strict'

let _loggerDeps = {
  grcSlackFac: {
    logError () {
      return Promise
        .reject(new Error('ERR_GRC_SLACK_IS_NOT_AVAILABLE'))
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
