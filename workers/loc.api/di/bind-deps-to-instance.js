'use strict'

const container = require('./index')

module.exports = (instance, deps, isInvoked) => {
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
