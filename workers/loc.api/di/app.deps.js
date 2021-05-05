'use strict'

const { ContainerModule } = require('inversify')

const TYPES = require('./types')
const {
  bindDepsToFn,
  bindDepsToInstance
} = require('./helpers')

const responder = require('../responder')
const {
  getREST,
  grcBfxReq,
  prepareResponse,
  prepareApiResponse
} = require('../helpers')
const HasGrcService = require('../has.grc.service')
const processor = require('../queue/processor')
const aggregator = require('../queue/aggregator')
const writeDataToStream = require('../queue/write-data-to-stream')
const uploadToS3 = require('../queue/upload-to-s3')
const sendMail = require('../queue/send-mail')
const generateCsv = require('../generate-csv')
const CsvJobData = require('../generate-csv/csv.job.data')
const Interrupter = require('../interrupter')

module.exports = ({
  rService,
  processorQueue,
  aggregatorQueue,
  deflateFac,
  link
}) => {
  return new ContainerModule((bind) => {
    bind(TYPES.RService).toConstantValue(rService)
    bind(TYPES.RootPath).toConstantValue(rService.ctx.rootPath)
    bind(TYPES.RServiceDepsSchema).toConstantValue([
      ['_responder', TYPES.Responder],
      ['_getREST', TYPES.GetREST],
      ['_grcBfxReq', TYPES.GrcBfxReq],
      ['_prepareApiResponse', TYPES.PrepareApiResponse],
      ['_generateCsv', TYPES.GenerateCsv],
      ['_hasGrcService', TYPES.HasGrcService]
    ])
    bind(TYPES.RServiceDepsSchemaAliase)
      .toDynamicValue((ctx) => {
        return ctx.container.get(TYPES.RServiceDepsSchema)
      })
    bind(TYPES.InjectDepsToRService)
      .toDynamicValue((ctx) => {
        return bindDepsToInstance(
          ctx.container.get(TYPES.RService),
          ctx.container.get(TYPES.RServiceDepsSchemaAliase)
        )
      })
      .inSingletonScope()
    bind(TYPES.Responder).toConstantValue(
      bindDepsToFn(
        responder,
        [
          TYPES.Container,
          TYPES.Logger
        ]
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
    bind(TYPES.Link).toConstantValue(link)
    bind(TYPES.HasGrcService)
      .to(HasGrcService)
      .inSingletonScope()
    bind(TYPES.ProcessorQueue).toConstantValue(
      processorQueue
    )
    bind(TYPES.AggregatorQueue).toConstantValue(
      aggregatorQueue
    )
    bind(TYPES.DeflateFac).toConstantValue(
      deflateFac
    )
    bind(TYPES.CsvJobData)
      .to(CsvJobData)
      .inSingletonScope()
    bind(TYPES.GenerateCsv)
      .toDynamicValue(() => bindDepsToFn(
        generateCsv,
        [
          TYPES.ProcessorQueue,
          TYPES.HasGrcService,
          TYPES.CsvJobData,
          TYPES.RService,
          TYPES.RootPath
        ]
      ))
    bind(TYPES.WriteDataToStream).toConstantValue(
      bindDepsToFn(
        writeDataToStream,
        [
          TYPES.RService,
          TYPES.ProcessorQueue
        ]
      )
    )
    bind(TYPES.UploadToS3).toConstantValue(
      bindDepsToFn(
        uploadToS3,
        [
          TYPES.CONF,
          TYPES.DeflateFac,
          TYPES.HasGrcService,
          TYPES.GrcBfxReq
        ]
      )
    )
    bind(TYPES.SendMail).toConstantValue(
      bindDepsToFn(
        sendMail,
        [TYPES.GrcBfxReq]
      )
    )
    bind(TYPES.Processor).toConstantValue(
      bindDepsToFn(
        processor,
        [
          TYPES.CONF,
          TYPES.RootPath,
          TYPES.ProcessorQueue,
          TYPES.AggregatorQueue,
          TYPES.WriteDataToStream
        ]
      )
    )
    bind(TYPES.Aggregator).toConstantValue(
      bindDepsToFn(
        aggregator,
        [
          TYPES.CONF,
          TYPES.RootPath,
          TYPES.AggregatorQueue,
          TYPES.HasGrcService,
          TYPES.UploadToS3,
          TYPES.SendMail
        ]
      )
    )
    bind(TYPES.Interrupter)
      .to(Interrupter)
  })
}
