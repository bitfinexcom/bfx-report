'use strict'

const path = require('path')
const request = require('supertest')

const {
  startEnvironment,
  stopEnvironment
} = require('./helpers/helpers.boot')
const {
  rmDB,
  rmAllFiles
} = require('./helpers/helpers.core')
const {
  createMockRESTv2SrvWithDate
} = require('./helpers/helpers.mock-rest-v2')
const {
  reportFileGenerations
} = require('./test-cases')

process.env.NODE_CONFIG_DIR = path.join(__dirname, 'config')
const { app } = require('bfx-report-express')
const agent = request.agent(app)

let wrkReportServiceApi = null
let mockRESTv2Srv = null

const basePath = '/api'
const tempDirPath = path.join(__dirname, '..', 'workers/loc.api/queue/temp')
const dbDirPath = path.join(__dirname, '..', 'db')
const date = new Date()
const end = date.getTime()
const start = (new Date()).setDate(date.getDate() - 90)
const email = 'fake@email.fake'
const auth = {
  apiKey: 'fake',
  apiSecret: 'fake'
}
const mockDataAmount = 10000

describe('Queue', () => {
  const params = {
    mockDataAmount,
    processorQueue: null,
    aggregatorQueue: null,
    basePath,
    auth,
    email,
    date,
    end,
    start
  }

  before(async function () {
    this.timeout(20000)

    mockRESTv2Srv = createMockRESTv2SrvWithDate(start, end, mockDataAmount)

    await rmAllFiles(tempDirPath)
    await rmDB(dbDirPath)
    const env = await startEnvironment()

    wrkReportServiceApi = env.wrksReportServiceApi[0]
    params.processorQueue = wrkReportServiceApi.lokue_processor.q
    params.aggregatorQueue = wrkReportServiceApi.lokue_aggregator.q
  })

  after(async function () {
    this.timeout(20000)

    await stopEnvironment()
    await rmDB(dbDirPath)
    await rmAllFiles(tempDirPath)

    try {
      await mockRESTv2Srv.close()
    } catch (err) { }
  })

  describe('CSV generation', () => {
    reportFileGenerations(agent, params)
  })

  describe('PDF generation', () => {
    params.isPDFRequired = true
    reportFileGenerations(agent, params)
  })
})
