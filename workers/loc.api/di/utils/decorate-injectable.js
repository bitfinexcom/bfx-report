'use strict'

const {
  decorate,
  injectable,
  inject
} = require('inversify')

const _TYPES = require('../types')

module.exports = (
  ModuleClass,
  getDepsTypesFn,
  TYPES = _TYPES
) => {
  decorate(injectable(), ModuleClass)

  const depsTypes = typeof getDepsTypesFn === 'function'
    ? getDepsTypesFn(TYPES)
    : getDepsTypesFn

  if (!Array.isArray(depsTypes)) {
    return ModuleClass
  }

  for (const [i, depsType] of depsTypes.entries()) {
    decorate(inject(depsType), ModuleClass, i)
  }

  return ModuleClass
}
