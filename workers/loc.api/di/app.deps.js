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
  prepareApiResponse,
  FOREX_SYMBS,
  getDataFromApi
} = require('../helpers')
const HasGrcService = require('../has.grc.service')
const processor = require('../queue/processor')
const aggregator = require('../queue/aggregator')
const writeDataToStream = require('../queue/write-data-to-stream')
const uploadToS3 = require('../queue/upload-to-s3')
const sendMail = require('../queue/send-mail')
const generateReportFile = require('../generate-report-file')
const PdfWriter = require('../generate-report-file/pdf-writer')
const ReportFileJobData = require('../generate-report-file/report.file.job.data')
const Interrupter = require('../interrupter')
const AbstractWSEventEmitter = require('../abstract.ws.event.emitter')
const {
  weightedAveragesReportCsvWriter
} = require('../generate-report-file/csv-writer')
const WeightedAveragesReport = require('../weighted.averages.report')
const BfxApiRouter = require('../bfx.api.router')

module.exports = ({
  rService,
  processorQueue,
  aggregatorQueue,
  deflateFac,
  grcSlackFac,
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
      ['_generateReportFile', TYPES.GenerateReportFile],
      ['_hasGrcService', TYPES.HasGrcService],
      ['_weightedAveragesReport', TYPES.WeightedAveragesReport]
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
    bind(TYPES.GetDataFromApi).toConstantValue(
      bindDepsToFn(getDataFromApi)
    )
    bind(TYPES.Responder).toConstantValue(
      bindDepsToFn(
        responder,
        [
          TYPES.Container,
          TYPES.Logger
        ]
      )
    )
    bind(TYPES.BfxApiRouter)
      .to(BfxApiRouter)
      .inSingletonScope()
    bind(TYPES.GetREST).toConstantValue(
      bindDepsToFn(
        getREST,
        [
          TYPES.CONF,
          TYPES.BfxApiRouter
        ]
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
    bind(TYPES.FOREX_SYMBS).toConstantValue(FOREX_SYMBS)
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
    bind(TYPES.GrcSlackFac).toConstantValue(
      grcSlackFac
    )
    bind(TYPES.PdfWriter)
      .to(PdfWriter)
      .inSingletonScope()
    bind(TYPES.ReportFileJobData)
      .to(ReportFileJobData)
      .inSingletonScope()
    bind(TYPES.GenerateReportFile)
      .toDynamicValue(() => bindDepsToFn(
        generateReportFile,
        [
          TYPES.ProcessorQueue,
          TYPES.HasGrcService,
          TYPES.ReportFileJobData,
          TYPES.RService,
          TYPES.RootPath,
          TYPES.CONF
        ]
      ))
    bind(TYPES.WriteDataToStream).toConstantValue(
      bindDepsToFn(
        writeDataToStream,
        [
          TYPES.RService,
          TYPES.ProcessorQueue,
          TYPES.GetDataFromApi
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
    bind(TYPES.Processor)
      .toDynamicValue(() => bindDepsToFn(
        processor,
        [
          TYPES.CONF,
          TYPES.RootPath,
          TYPES.ProcessorQueue,
          TYPES.AggregatorQueue,
          TYPES.WriteDataToStream,
          TYPES.PdfWriter
        ]
      ))
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
    bind(TYPES.AbstractWSEventEmitter)
      .to(AbstractWSEventEmitter)
    bind(TYPES.WeightedAveragesReportCsvWriter)
      .toConstantValue(
        bindDepsToFn(
          weightedAveragesReportCsvWriter,
          [
            TYPES.RService,
            TYPES.GetDataFromApi
          ]
        )
      )
    bind(TYPES.WeightedAveragesReport)
      .to(WeightedAveragesReport)
  })
}
