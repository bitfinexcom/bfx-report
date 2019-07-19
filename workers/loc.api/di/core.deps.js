'use strict'

const { ContainerModule } = require('inversify')

const TYPES = require('./types')
const bindDepsToFn = require('./bind-deps-to-fn')

const loggerFactory = require('../logger')

module.exports = () => {
  return new ContainerModule((bind) => {
    bind(TYPES.LoggerFactory).toFunction(loggerFactory)
    bind(TYPES.Logger).toDynamicValue((ctx) => {
      return bindDepsToFn(
        ctx.container.get(TYPES.LoggerFactory),
        [TYPES.CONF]
      )
    }).inSingletonScope()
  })
}
