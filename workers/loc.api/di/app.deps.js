'use strict'

const { ContainerModule } = require('inversify')

const TYPES = require('./types')
const bindDepsToFn = require('./bind-deps-to-fn')
const bindDepsToInstance = require('./bind-deps-to-instance')

const responder = require('../responder')
const {
  getREST,
  grcBfxReq
} = require('../helpers')

module.exports = (
  rService
) => {
  return new ContainerModule((bind) => {
    bind(TYPES.RService).toConstantValue(rService)
    bind(TYPES.InjectDepsToRService).toDynamicValue((ctx) => {
      return bindDepsToInstance(
        ctx.container.get(TYPES.RService),
        [
          ['_responder', TYPES.Responder],
          ['_getREST', TYPES.GetREST],
          ['_grcBfxReq', TYPES.GrcBfxReq]
        ]
      )
    }).inSingletonScope()
    bind(TYPES.Responder).toConstantValue(
      bindDepsToFn(
        responder,
        [TYPES.Container, TYPES.Logger]
      )
    )
    bind(TYPES.GetREST).toConstantValue(
      bindDepsToFn(
        getREST,
        [TYPES.CONF]
      )
    )
    bind(TYPES.GrcBfxReq).toConstantValue(
      bindDepsToFn(
        grcBfxReq,
        [TYPES.RService]
      )
    )
  })
}
