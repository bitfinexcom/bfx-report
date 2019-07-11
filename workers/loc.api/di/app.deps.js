'use strict'

const { ContainerModule } = require('inversify')

const TYPES = require('./types')
const bindDepsToFn = require('./bind-deps-to-fn')
const bindDepsToInstance = require('./bind-deps-to-instance')

const responder = require('../responder')
const {
  getREST,
  grcBfxReq,
  prepareResponse,
  prepareApiResponse,
  generateCsv
} = require('../helpers')
const HasGrcService = require('../has.grc.service')

module.exports = (
  rService,
  processorQueue,
  aggregatorQueue
) => {
  return new ContainerModule((bind) => {
    bind(TYPES.RService).toConstantValue(rService)
    bind(TYPES.InjectDepsToRService)
      .toDynamicValue((ctx) => {
        return bindDepsToInstance(
          ctx.container.get(TYPES.RService),
          [
            ['_responder', TYPES.Responder],
            ['_getREST', TYPES.GetREST],
            ['_grcBfxReq', TYPES.GrcBfxReq],
            ['_prepareApiResponse', TYPES.PrepareApiResponse],
            ['_generateCsv', TYPES.GenerateCsv]
          ]
        )
      })
      .inSingletonScope()
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
    bind(TYPES.PrepareResponse).toConstantValue(
      prepareResponse
    )
    bind(TYPES.PrepareApiResponse).toConstantValue(
      bindDepsToFn(
        prepareApiResponse,
        [TYPES.GetREST]
      )
    )
    bind(TYPES.HasGrcService)
      .to(HasGrcService)
      .inSingletonScope()
    bind(TYPES.ProcessorQueue).toConstantValue(
      processorQueue
    )
    bind(TYPES.AggregatorQueue).toConstantValue(
      aggregatorQueue
    )
    bind(TYPES.GenerateCsv).toConstantValue(
      bindDepsToFn(
        generateCsv,
        [
          TYPES.RService,
          TYPES.ProcessorQueue,
          TYPES.HasGrcService
        ]
      )
    )
  })
}
