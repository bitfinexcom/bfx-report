'use strict'

const { ContainerModule } = require('inversify')

const TYPES = require('./types')
const { bindDepsToFn } = require('./helpers')

const loggerFactory = require('../logger')
const dataValidator = require('../data-validator')

module.exports = () => {
  return new ContainerModule((bind) => {
    bind(TYPES.LoggerFactory).toFunction(loggerFactory)
    bind(TYPES.Logger).toDynamicValue((ctx) => {
      return bindDepsToFn(
        ctx.container.get(TYPES.LoggerFactory),
        [TYPES.CONF]
      )
    }).inSingletonScope()
    bind(TYPES.DataValidator).toConstantValue(dataValidator)
  })
}
