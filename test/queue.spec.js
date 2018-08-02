'use strict'

const path = require('path')
const fs = require('fs')
const { assert } = require('chai')
const request = require('supertest')

const {
  startEnviroment,
  stopEnviroment
} = require('./helpers/helpers.boot')
const {
  cleanJobs,
  rmAllFiles,
  queueToPromise
} = require('./helpers/helpers.core')
const { createMockRESTv2SrvWithDate } = require('./helpers/helpers.mock-rest-v2')

const { app } = require('../app')
const agent = request.agent(app)

let wrkReportServiceApi = null
let auth = {
  apiKey: 'fake',
  apiSecret: 'fake'
}
let processorQueue = null
let aggregatorQueue = null
let mockRESTv2Srv = null

const basePath = '/api'
const tempDirPath = path.join(__dirname, '..', 'workers/loc.api/bull/temp')
const email = 'fake@mail.fake'
const date = new Date()
const end = date.getTime()
const start = (new Date()).setDate(date.getDate() - 90)

describe('Queue', () => {
  before(async function () {
    this.timeout(20000)

    mockRESTv2Srv = createMockRESTv2SrvWithDate(date)

    const env = await startEnviroment()
    wrkReportServiceApi = env.wrkReportServiceApi
    processorQueue = wrkReportServiceApi.bull_processor.queue
    aggregatorQueue = wrkReportServiceApi.bull_aggregator.queue

    await cleanJobs(processorQueue)
    await cleanJobs(aggregatorQueue)
  })

  after(async function () {
    this.timeout(5000)

    try {
      await mockRESTv2Srv.close()
    } catch (err) { }

    await cleanJobs(processorQueue)
    await cleanJobs(aggregatorQueue)
    await rmAllFiles(tempDirPath)
    await stopEnviroment()
  })

  it('it should be successfully performed by the getLedgersCsv method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(processorQueue)
    const aggrPromise = queueToPromise(aggregatorQueue)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getLedgersCsv',
        params: {
          symbol: 'BTC',
          end,
          start,
          limit: 120000,
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isOk(res.body.result)

    const procRes = await procPromise

    assert.isObject(procRes)
    assert.property(procRes, 'filePath')
    assert.property(procRes, 'email')
    assert.isString(procRes.filePath)
    assert.isString(procRes.email)
    assert.isOk(fs.existsSync(procRes.filePath))

    await aggrPromise
  })

  it('it should be successfully performed by the getTradesCsv method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(processorQueue)
    const aggrPromise = queueToPromise(aggregatorQueue)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getTradesCsv',
        params: {
          symbol: 'tBTCUSD',
          end,
          start,
          limit: 1000,
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isOk(res.body.result)

    const procRes = await procPromise

    assert.isObject(procRes)
    assert.property(procRes, 'filePath')
    assert.property(procRes, 'email')
    assert.isString(procRes.filePath)
    assert.isString(procRes.email)
    assert.isOk(fs.existsSync(procRes.filePath))

    await aggrPromise
  })

  it('it should be successfully performed by the getOrdersCsv method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(processorQueue)
    const aggrPromise = queueToPromise(aggregatorQueue)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getOrdersCsv',
        params: {
          symbol: 'tBTCUSD',
          end,
          start,
          limit: 1000,
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isOk(res.body.result)

    const procRes = await procPromise

    assert.isObject(procRes)
    assert.property(procRes, 'filePath')
    assert.property(procRes, 'email')
    assert.isString(procRes.filePath)
    assert.isString(procRes.email)
    assert.isOk(fs.existsSync(procRes.filePath))

    await aggrPromise
  })

  it('it should be successfully performed by the getMovementsCsv method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(processorQueue)
    const aggrPromise = queueToPromise(aggregatorQueue)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getMovementsCsv',
        params: {
          symbol: 'BTC',
          end,
          start,
          limit: 1000,
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isOk(res.body.result)

    const procRes = await procPromise

    assert.isObject(procRes)
    assert.property(procRes, 'filePath')
    assert.property(procRes, 'email')
    assert.isString(procRes.filePath)
    assert.isString(procRes.email)
    assert.isOk(fs.existsSync(procRes.filePath))

    await aggrPromise
  })

  it('it should not be successfully auth by the getLedgersCsv method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(processorQueue)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        method: 'getLedgersCsv',
        params: {
          symbol: 'BTC',
          end,
          start,
          limit: 1000,
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isOk(res.body.result)

    try {
      await procPromise
      assert(false, 'The queue must not completed')
    } catch (err) {
      assert.match(err.toString(), /(apikey: digest invalid)|(ERR_ARGS_NO_AUTH_DATA)/)
    }
  })

  it('it should not be successfully performed by the getLedgersCsv method, without email param', async function () {
    this.timeout(60000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getLedgersCsv',
        params: {
          symbol: 'BTC',
          end,
          start,
          limit: 1000
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(500)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isNotOk(res.body.result)
    assert.isObject(res.body.error)
    assert.propertyVal(res.body.error, 'code', 500)
    assert.propertyVal(res.body.error, 'message', 'Internal Server Error')
  })
})
