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
  rmDB,
  rmAllFiles,
  queueToPromise,
  queueToPromiseMulti
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
const tempDirPath = path.join(__dirname, '..', 'workers/loc.api/queue/temp')
const dbDirPath = path.join(__dirname, '..', 'db')
const date = new Date()
const end = date.getTime()
const start = (new Date()).setDate(date.getDate() - 90)
const email = 'fake@email.fake'

describe('Queue', () => {
  before(async function () {
    this.timeout(20000)

    mockRESTv2Srv = createMockRESTv2SrvWithDate(date)

    await rmAllFiles(tempDirPath)
    await rmDB(dbDirPath)
    const env = await startEnviroment()

    wrkReportServiceApi = env.wrksReportServiceApi[0]
    processorQueue = wrkReportServiceApi.lokue_processor.q
    aggregatorQueue = wrkReportServiceApi.lokue_aggregator.q
  })

  after(async function () {
    this.timeout(5000)

    await stopEnviroment()
    await rmDB(dbDirPath)
    await rmAllFiles(tempDirPath)

    try {
      await mockRESTv2Srv.close()
    } catch (err) { }
  })

  it('it should be successfully performed by the getFundingOfferHistoryCsv method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(processorQueue)
    const aggrPromise = queueToPromise(aggregatorQueue)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getFundingOfferHistoryCsv',
        params: {
          symbol: 'fUSD',
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
    assert.isObject(res.body.result)
    assert.isOk(res.body.result.isSendEmail || res.body.result.isSaveLocaly)

    const procRes = await procPromise

    assert.isObject(procRes)
    assert.containsAllKeys(procRes, [
      'name',
      'filePath',
      'email',
      'endDate',
      'startDate',
      'isUnauth'
    ])
    assert.isString(procRes.name)
    assert.isString(procRes.filePath)
    assert.isFinite(procRes.endDate)
    assert.isFinite(procRes.startDate)
    assert.isBoolean(procRes.isUnauth)
    assert.isOk(fs.existsSync(procRes.filePath))

    await aggrPromise

    assert.isNotOk(fs.existsSync(procRes.filePath))
  })

  it('it should be successfully performed by the getFundingLoanHistoryCsv method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(processorQueue)
    const aggrPromise = queueToPromise(aggregatorQueue)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getFundingLoanHistoryCsv',
        params: {
          symbol: 'fUSD',
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
    assert.isObject(res.body.result)
    assert.isOk(res.body.result.isSendEmail || res.body.result.isSaveLocaly)

    const procRes = await procPromise

    assert.isObject(procRes)
    assert.containsAllKeys(procRes, [
      'name',
      'filePath',
      'email',
      'endDate',
      'startDate',
      'isUnauth'
    ])
    assert.isString(procRes.name)
    assert.isString(procRes.filePath)
    assert.isFinite(procRes.endDate)
    assert.isFinite(procRes.startDate)
    assert.isBoolean(procRes.isUnauth)
    assert.isOk(fs.existsSync(procRes.filePath))

    await aggrPromise

    assert.isNotOk(fs.existsSync(procRes.filePath))
  })

  it('it should be successfully performed by the getFundingCreditHistoryCsv method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(processorQueue)
    const aggrPromise = queueToPromise(aggregatorQueue)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getFundingCreditHistoryCsv',
        params: {
          symbol: 'fUSD',
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
    assert.isObject(res.body.result)
    assert.isOk(res.body.result.isSendEmail || res.body.result.isSaveLocaly)

    const procRes = await procPromise

    assert.isObject(procRes)
    assert.containsAllKeys(procRes, [
      'name',
      'filePath',
      'email',
      'endDate',
      'startDate',
      'isUnauth'
    ])
    assert.isString(procRes.name)
    assert.isString(procRes.filePath)
    assert.isFinite(procRes.endDate)
    assert.isFinite(procRes.startDate)
    assert.isBoolean(procRes.isUnauth)
    assert.isOk(fs.existsSync(procRes.filePath))

    await aggrPromise

    assert.isNotOk(fs.existsSync(procRes.filePath))
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
          limit: 1000,
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isOk(res.body.result.isSendEmail || res.body.result.isSaveLocaly)

    const procRes = await procPromise

    assert.isObject(procRes)
    assert.containsAllKeys(procRes, [
      'name',
      'filePath',
      'email',
      'endDate',
      'startDate',
      'isUnauth'
    ])
    assert.isString(procRes.name)
    assert.isString(procRes.filePath)
    assert.isFinite(procRes.endDate)
    assert.isFinite(procRes.startDate)
    assert.isBoolean(procRes.isUnauth)
    assert.isOk(fs.existsSync(procRes.filePath))

    await aggrPromise

    assert.isNotOk(fs.existsSync(procRes.filePath))
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
    assert.isObject(res.body.result)
    assert.isOk(res.body.result.isSendEmail || res.body.result.isSaveLocaly)

    const procRes = await procPromise

    assert.isObject(procRes)
    assert.containsAllKeys(procRes, [
      'name',
      'filePath',
      'email',
      'endDate',
      'startDate',
      'isUnauth'
    ])
    assert.isString(procRes.name)
    assert.isString(procRes.filePath)
    assert.isFinite(procRes.endDate)
    assert.isFinite(procRes.startDate)
    assert.isBoolean(procRes.isUnauth)
    assert.isOk(fs.existsSync(procRes.filePath))

    await aggrPromise

    assert.isNotOk(fs.existsSync(procRes.filePath))
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
    assert.isObject(res.body.result)
    assert.isOk(res.body.result.isSendEmail || res.body.result.isSaveLocaly)

    const procRes = await procPromise

    assert.isObject(procRes)
    assert.containsAllKeys(procRes, [
      'name',
      'filePath',
      'email',
      'endDate',
      'startDate',
      'isUnauth'
    ])
    assert.isString(procRes.name)
    assert.isString(procRes.filePath)
    assert.isFinite(procRes.endDate)
    assert.isFinite(procRes.startDate)
    assert.isBoolean(procRes.isUnauth)
    assert.isOk(fs.existsSync(procRes.filePath))

    await aggrPromise

    assert.isNotOk(fs.existsSync(procRes.filePath))
  })

  it('it should be successfully performed by the getMovementsCsv method', async function () {
    this.timeout(3 * 60000)

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
          limit: 10000,
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isOk(res.body.result.isSendEmail || res.body.result.isSaveLocaly)

    const procRes = await procPromise

    assert.isObject(procRes)
    assert.containsAllKeys(procRes, [
      'name',
      'filePath',
      'email',
      'endDate',
      'startDate',
      'isUnauth'
    ])
    assert.isString(procRes.name)
    assert.isString(procRes.filePath)
    assert.isFinite(procRes.endDate)
    assert.isFinite(procRes.startDate)
    assert.isBoolean(procRes.isUnauth)
    assert.isOk(fs.existsSync(procRes.filePath))

    await aggrPromise

    assert.isNotOk(fs.existsSync(procRes.filePath))
  })

  it('it should not be successfully auth by the getLedgersCsv method', async function () {
    this.timeout(60000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        method: 'getLedgersCsv',
        params: {
          symbol: 'BTC',
          end,
          start,
          limit: 10000,
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(500)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.error)
    assert.containsAllKeys(res.body.error, [
      'code',
      'message'
    ])
  })

  it('it should be successfully performed by the getLedgersCsv method, with multiple users', async function () {
    this.timeout(5 * 60000)

    const count = 10
    const procPromise = queueToPromiseMulti(
      processorQueue,
      count,
      procRes => {
        assert.isObject(procRes)
        assert.containsAllKeys(procRes, [
          'name',
          'filePath',
          'email',
          'endDate',
          'startDate',
          'isUnauth'
        ])
        assert.isString(procRes.name)
        assert.isString(procRes.filePath)
        assert.isFinite(procRes.endDate)
        assert.isFinite(procRes.startDate)
        assert.isBoolean(procRes.isUnauth)
        assert.isOk(fs.existsSync(procRes.filePath))
      }
    )
    const aggrPromise = queueToPromiseMulti(aggregatorQueue, count)

    for (let i = 0; i < count; i += 1) {
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
            limit: 10000,
            email
          },
          id: 5
        })
        .expect('Content-Type', /json/)
        .expect(200)

      assert.isObject(res.body)
      assert.propertyVal(res.body, 'id', 5)
      assert.isObject(res.body.result)
      assert.isOk(res.body.result.isSendEmail || res.body.result.isSaveLocaly)
    }

    await procPromise
    await aggrPromise
  })
})
