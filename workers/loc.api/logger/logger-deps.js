'use strict'

let _loggerDeps = {
  grcSlackFac: {
    logError () {}
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
