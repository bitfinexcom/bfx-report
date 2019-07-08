'use strict'

const { ContainerModule } = require('inversify')

const TYPES = require('./types')
const bindDepsToFn = require('./bind-deps-to-fn')

const responder = require('../responder')

module.exports = (
  RService
) => {
  return new ContainerModule((bind) => {
    bind(TYPES.RService).toConstantValue(RService)
    bind(TYPES.Responder).toConstantValue(
      bindDepsToFn(
        responder,
        [TYPES.Logger]
      )
    )
  })
}
