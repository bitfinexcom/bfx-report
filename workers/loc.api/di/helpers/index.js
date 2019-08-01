'use strict'

const container = require('../index')

const bindDepsToFn = (fn, deps, isNotInvoked) => {
  const injections = deps.map((dep) => {
    return container.get(dep)
  })
  const boundFn = fn.bind(fn, ...injections)

  return isNotInvoked
    ? boundFn
    : boundFn()
}

const bindDepsToInstance = (instance, deps, isInvoked) => {
  const bind = () => {
    deps.forEach(([name, type]) => {
      instance[name] = container.get(type)
    })

    return instance
  }

  return isInvoked
    ? bind()
    : bind
}

module.exports = {
  bindDepsToFn,
  bindDepsToInstance
}
