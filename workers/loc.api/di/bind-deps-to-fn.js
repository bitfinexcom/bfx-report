'use strict'

const container = require('./index')

module.exports = (fn, deps, isNotInvoked) => {
  const injections = deps.map((dep) => {
    return container.get(dep)
  })
  const boundFn = fn.bind(fn, ...injections)

  return isNotInvoked
    ? boundFn
    : boundFn()
}
