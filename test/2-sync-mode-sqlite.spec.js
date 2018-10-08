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
  queueToPromiseMulti,
  delay,
  connToSQLite,
  closeSQLite
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
let db = null

const basePath = '/api'
const tempDirPath = path.join(__dirname, '..', 'workers/loc.api/queue/temp')
const dbDirPath = path.join(__dirname, '..', 'db')
const date = new Date()
const end = date.getTime()
const start = (new Date()).setDate(date.getDate() - 90)
const email = 'fake@email.fake'

describe('Sync mode with SQLite', () => {
  before(async function () {
    this.timeout(20000)

    mockRESTv2Srv = createMockRESTv2SrvWithDate(start, end, 10000)

    await rmAllFiles(tempDirPath)
    await rmDB(dbDirPath)
    const env = await startEnviroment(false, false, 1, {
      syncMode: true,
      isSchedulerEnabled: true,
      dbDriver: 'sqlite'
    })

    wrkReportServiceApi = env.wrksReportServiceApi[0]
    processorQueue = wrkReportServiceApi.lokue_processor.q
    aggregatorQueue = wrkReportServiceApi.lokue_aggregator.q

    db = await connToSQLite(wrkReportServiceApi)
  })

  after(async function () {
    this.timeout(5000)

    await stopEnviroment()
    await closeSQLite(db)
    await rmDB(dbDirPath)
    await rmAllFiles(tempDirPath)

    try {
      await mockRESTv2Srv.close()
    } catch (err) { }
  })

  it('it should be successfully performed by the isSyncModeConfig method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        method: 'isSyncModeConfig',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isOk(res.body.result)
  })

  it('it should be successfully performed by the login method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'login',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isOk(res.body.result === email)
  })

  it('it should be successfully performed by the checkAuthInDb method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'checkAuthInDb',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isOk(res.body.result === email)
  })

  it('it should be successfully performed by the enableSyncMode method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'enableSyncMode',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isOk(res.body.result)
  })

  it('it should be successfully performed by the isSyncModeWithDbData method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'isSyncModeWithDbData',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isOk(res.body.result)
  })

  it('it should be successfully performed by the enableScheduler method', async function () {
    this.timeout(60000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'enableScheduler',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isNumber(res.body.result)
  })

  it('it should be successfully performed by the isSchedulerEnabled method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        method: 'isSchedulerEnabled',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isOk(res.body.result)
  })

  it('it should be successfully performed by the getSyncProgress method', async function () {
    this.timeout(60000)

    while (true) {
      const res = await agent
        .post(`${basePath}/get-data`)
        .type('json')
        .send({
          method: 'getSyncProgress',
          id: 5
        })
        .expect('Content-Type', /json/)
        .expect(200)

      assert.isObject(res.body)
      assert.propertyVal(res.body, 'id', 5)
      assert.isNumber(res.body.result)

      if (
        typeof res.body.result !== 'number' ||
        res.body.result === 100
      ) {
        break
      }

      await delay()
    }
  })

  it('it should be successfully performed by the syncNow method', async function () {
    this.timeout(60000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'syncNow',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isNumber(res.body.result)
  })

  it('it should be successfully auth', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/check-auth`)
      .type('json')
      .send({
        auth,
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'result', true)
    assert.propertyVal(res.body, 'id', 5)
  })

  it('it should not be successfully auth', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/check-auth`)
      .type('json')
      .send({
        auth: {
          apiKey: '',
          apiSecret: ''
        }
      })
      .expect('Content-Type', /json/)
      .expect(401)

    assert.isObject(res.body)
    assert.isObject(res.body.error)
    assert.propertyVal(res.body.error, 'code', 401)
    assert.propertyVal(res.body.error, 'message', 'Unauthorized')
    assert.propertyVal(res.body, 'id', null)
  })

  it('it should be successfully check, csv is stored locally', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/check-stored-locally`)
      .type('json')
      .send({
        auth,
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.isString(res.body.result)
    assert.propertyVal(res.body, 'id', 5)
  })

  it('it should be successfully performed by the getEmail method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getEmail',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isOk(res.body.result === email)
  })

  it.skip('it should be successfully performed by the getSymbols method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getSymbols',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.pairs)
    assert.isArray(res.body.result.coins)
    assert.lengthOf(res.body.result.pairs, 11)

    res.body.result.pairs.forEach(item => {
      assert.isString(item)
    })
    res.body.result.coins.forEach(item => {
      assert.isString(item)
    })
  })

  it('it should be successfully performed by the getFundingOfferHistory method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getFundingOfferHistory',
        params: {
          symbol: 'fUSD',
          start: 0,
          end: (new Date()).getTime,
          limit: 1
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isArray(res.body.result)

    if (res.body.result.length > 0) {
      let resItem = res.body.result[0]

      assert.isObject(resItem)
      assert.containsAllKeys(resItem, [
        'id',
        'symbol',
        'mtsCreate',
        'mtsUpdate',
        'amount',
        'amountOrig',
        'type',
        'flags',
        'status',
        'rate',
        'period',
        'notify',
        'hidden',
        'renew',
        'rateReal'
      ])
    }
  })

  it('it should be successfully performed by the getFundingLoanHistory method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getFundingLoanHistory',
        params: {
          symbol: 'fUSD',
          start: 0,
          end: (new Date()).getTime,
          limit: 1
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isArray(res.body.result)

    if (res.body.result.length > 0) {
      let resItem = res.body.result[0]

      assert.isObject(resItem)
      assert.containsAllKeys(resItem, [
        'id',
        'symbol',
        'side',
        'mtsCreate',
        'mtsUpdate',
        'amount',
        'flags',
        'status',
        'rate',
        'period',
        'mtsOpening',
        'mtsLastPayout',
        'notify',
        'hidden',
        'renew',
        'rateReal',
        'noClose'
      ])
    }
  })

  it('it should be successfully performed by the getFundingCreditHistory method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getFundingCreditHistory',
        params: {
          symbol: 'fUSD',
          start: 0,
          end: (new Date()).getTime,
          limit: 1
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isArray(res.body.result)

    if (res.body.result.length > 0) {
      let resItem = res.body.result[0]

      assert.isObject(resItem)
      assert.containsAllKeys(resItem, [
        'id',
        'symbol',
        'side',
        'mtsCreate',
        'mtsUpdate',
        'amount',
        'flags',
        'status',
        'rate',
        'period',
        'mtsOpening',
        'mtsLastPayout',
        'notify',
        'hidden',
        'renew',
        'rateReal',
        'noClose',
        'positionPair'
      ])
    }
  })

  it('it should be successfully performed by the getLedgers method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getLedgers',
        params: {
          symbol: 'BTC',
          start: 0,
          end: (new Date()).getTime,
          limit: 1
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isArray(res.body.result)

    if (res.body.result.length > 0) {
      let resItem = res.body.result[0]

      assert.isObject(resItem)
      assert.containsAllKeys(resItem, [
        'id',
        'currency',
        'mts',
        'amount',
        'balance',
        'description'
      ])
    }
  })

  it('it should be successfully performed by the getLedgers method, without params', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getLedgers',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isArray(res.body.result)

    if (res.body.result.length > 0) {
      let resItem = res.body.result[0]

      assert.isObject(resItem)
      assert.containsAllKeys(resItem, [
        'id',
        'currency',
        'mts',
        'amount',
        'balance',
        'description'
      ])
    }
  })

  it('it should be successfully performed by the getTrades method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getTrades',
        params: {
          symbol: 'tBTCUSD',
          start: 0,
          end: (new Date()).getTime,
          limit: 1
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isArray(res.body.result)

    if (res.body.result.length > 0) {
      let resItem = res.body.result[0]

      assert.isObject(resItem)
      assert.containsAllKeys(resItem, [
        'id',
        'symbol',
        'mtsCreate',
        'orderID',
        'execAmount',
        'execPrice',
        'orderType',
        'orderPrice',
        'maker',
        'fee',
        'feeCurrency'
      ])
    }
  })

  it('it should be successfully performed by the getOrders method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getOrders',
        params: {
          symbol: 'tBTCUSD',
          start: 0,
          end: (new Date()).getTime,
          limit: 1
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isArray(res.body.result)

    if (res.body.result.length > 0) {
      let resItem = res.body.result[0]

      assert.isObject(resItem)
      assert.containsAllKeys(resItem, [
        'id',
        'gid',
        'cid',
        'symbol',
        'mtsCreate',
        'mtsUpdate',
        'amount',
        'amountOrig',
        'type',
        'typePrev',
        'flags',
        'status',
        'price',
        'priceAvg',
        'priceTrailing',
        'priceAuxLimit',
        'notify',
        'placedId'
      ])
    }
  })

  it('it should be successfully performed by the getMovements method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getMovements',
        params: {
          symbol: 'BTC',
          start: 0,
          end: (new Date()).getTime,
          limit: 1
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isArray(res.body.result)

    if (res.body.result.length > 0) {
      let resItem = res.body.result[0]

      assert.isObject(resItem)
      assert.containsAllKeys(resItem, [
        'id',
        'currency',
        'currencyName',
        'mtsStarted',
        'mtsUpdated',
        'status',
        'amount',
        'fees',
        'destinationAddress',
        'transactionId'
      ])
    }
  })

  it('it should be successfully performed by the getMovements method, without params', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getMovements',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isArray(res.body.result)

    if (res.body.result.length > 0) {
      let resItem = res.body.result[0]

      assert.isObject(resItem)
      assert.containsAllKeys(resItem, [
        'id',
        'currency',
        'currencyName',
        'mtsStarted',
        'mtsUpdated',
        'status',
        'amount',
        'fees',
        'destinationAddress',
        'transactionId'
      ])
    }
  })

  it('it should not be successfully performed by the getMovements method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getMovements',
        params: 'isNotObject',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(500)

    assert.isObject(res.body)
    assert.isObject(res.body.error)
    assert.propertyVal(res.body.error, 'code', 500)
    assert.propertyVal(res.body.error, 'message', 'Internal Server Error')
    assert.propertyVal(res.body, 'id', 5)
  })

  it('it should not be successfully performed by a fake method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'fake',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(500)

    assert.isObject(res.body)
    assert.isObject(res.body.error)
    assert.propertyVal(res.body.error, 'code', 500)
    assert.propertyVal(res.body.error, 'message', 'Internal Server Error')
    assert.propertyVal(res.body, 'id', 5)
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

    const file = fs.readFileSync(procRes.filePath, 'utf8')
    const arrOfLines = file.split(/\n/)

    assert.equal(arrOfLines.length - 2, 1000)

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

  it('it should be successfully performed by the getMovementsCsv method, where amount > 0', async function () {
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
          email,
          isDeposits: true
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

  it('it should be successfully performed by the getMovementsCsv method, where amount < 0', async function () {
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
          email,
          isWithdrawals: true
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

  it('it should be successfully performed by the disableScheduler method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'disableScheduler',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isOk(res.body.result)
  })

  it('it should be successfully performed by the isSchedulerEnabled method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        method: 'isSchedulerEnabled',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isNotOk(res.body.result)
  })

  it('it should be successfully performed by the getSyncProgress method', async function () {
    this.timeout(60000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        method: 'getSyncProgress',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isNotOk(res.body.result)
  })

  it('it should be successfully performed by the disableSyncMode method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'disableSyncMode',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isOk(res.body.result)
  })

  it('it should be successfully performed by the isSyncModeWithDbData method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'isSyncModeWithDbData',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isNotOk(res.body.result)
  })

  it('it should be successfully performed by the logout method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'logout',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isOk(res.body.result)
  })

  it('it should not be successfully performed by the enableScheduler method, unauth', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'enableScheduler',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(401)

    assert.isObject(res.body)
    assert.isObject(res.body.error)
    assert.propertyVal(res.body.error, 'code', 401)
    assert.propertyVal(res.body.error, 'message', 'Unauthorized')
    assert.propertyVal(res.body, 'id', 5)
  })
})
