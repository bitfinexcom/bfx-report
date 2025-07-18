'use strict'

const path = require('path')
const { assert } = require('chai')
const request = require('supertest')

const {
  startEnvironment,
  stopEnvironment
} = require('./helpers/helpers.boot')
const { rmDB } = require('./helpers/helpers.core')
const {
  createMockRESTv2SrvWithDate,
  createMockRESTv2SrvWithAllData
} = require('./helpers/helpers.mock-rest-v2')

process.env.NODE_CONFIG_DIR = path.join(__dirname, 'config')
const { app } = require('bfx-report-express')
const agent = request.agent(app)

const basePath = '/api'
const dbDirPath = path.join(__dirname, '..', 'db')
const date = new Date()
const end = date.getTime()
const start = (new Date()).setDate(date.getDate() - 1)
const auth = {
  apiKey: 'fake',
  apiSecret: 'fake'
}

let mockRESTv2Srv = null

describe('API', () => {
  before(async function () {
    this.timeout(20000)

    mockRESTv2Srv = createMockRESTv2SrvWithDate(start, end, 2)

    await rmDB(dbDirPath)
    await startEnvironment(true, true)
  })

  after(async function () {
    this.timeout(20000)

    try {
      await mockRESTv2Srv.close()
    } catch (err) { }

    await stopEnvironment()
    await rmDB(dbDirPath)
  })

  it('it should be successfully performed by the isSyncModeConfig method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        method: 'isSyncModeConfig',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isString(res.body.jsonrpc)
    assert.isNotOk(res.body.result)
  })

  it('it should be successfully auth', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        method: 'verifyUser',
        auth,
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.isObject(res.body.result)
    assert.isString(res.body.result.username)
    assert.isString(res.body.result.timezone)
    assert.isString(res.body.result.email)
    assert.isNumber(res.body.result.id)
    assert.isBoolean(res.body.result.isSubAccount)
    assert.isBoolean(res.body.result.isUserMerchant)
    assert.strictEqual(res.body.result.email, 'fake@email.fake')
    assert.propertyVal(res.body, 'id', 5)
  })

  it('it should be successfully performed by the generateToken method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        method: 'generateToken',
        auth,
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isArray(res.body.result)
    assert.lengthOf(res.body.result, 1)

    res.body.result.forEach((token) => {
      assert.isString(token)
      assert.strictEqual(token, 'pub:api:12ab12ab-12ab-12ab-12ab-12ab12ab12ab-read')
    })
  })

  it('it should be successfully performed by the getFilterModels method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        method: 'getFilterModels',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isAbove(Object.keys(res.body.result).length, 0)

    Object.values(res.body.result).forEach((model) => {
      assert.isObject(model)
      assert.isAbove(Object.keys(model).length, 0)

      Object.values(model).forEach((field) => {
        assert.isObject(field)
        assert.isString(field.type)
      })
    })
  })

  it('it should be successfully auth, with auth token', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        method: 'verifyUser',
        auth: { authToken: 'fake' },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.isObject(res.body.result)
    assert.isString(res.body.result.username)
    assert.isString(res.body.result.timezone)
    assert.isString(res.body.result.email)
    assert.isNumber(res.body.result.id)
    assert.isBoolean(res.body.result.isSubAccount)
    assert.isBoolean(res.body.result.isUserMerchant)
    assert.strictEqual(res.body.result.email, 'fake@email.fake')
    assert.propertyVal(res.body, 'id', 5)
  })

  it('it should not be successfully auth', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        method: 'verifyUser',
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
    assert.isObject(res.body.error.data)
    assert.propertyVal(res.body, 'id', null)
    assert.isString(res.body.jsonrpc)
  })

  it('it should be successfully performed by the getUsersTimeConf method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getUsersTimeConf',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isString(res.body.result.timezoneName)
    assert.isNumber(res.body.result.timezoneOffset)
  })

  it('it should be successfully performed by the getSymbols method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
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
    assert.isArray(res.body.result.currencies)
    assert.isArray(res.body.result.inactiveSymbols)
    assert.isArray(res.body.result.mapSymbols)
    assert.isArray(res.body.result.inactiveCurrencies)
    assert.isArray(res.body.result.marginCurrencyList)
    assert.lengthOf(res.body.result.pairs, 13)
    assert.lengthOf(res.body.result.currencies, 11)
    assert.lengthOf(res.body.result.inactiveSymbols, 2)
    assert.lengthOf(res.body.result.mapSymbols, 3)
    assert.lengthOf(res.body.result.inactiveCurrencies, 2)
    assert.lengthOf(res.body.result.marginCurrencyList, 4)

    res.body.result.pairs.forEach((item) => {
      assert.isString(item)
    })
    res.body.result.currencies.forEach((item) => {
      assert.isObject(item)
      assert.isString(item.id)
      assert.isString(item.name)
      assert.isBoolean(item.active)
      assert.isBoolean(item.isInPair)
      assert.isBoolean(item.isFunding)
    })
    res.body.result.inactiveSymbols.forEach((item) => {
      assert.isString(item)
    })
    res.body.result.mapSymbols.forEach((item) => {
      assert.lengthOf(item, 2)

      item.forEach((item) => {
        assert.isString(item)
      })
    })
    res.body.result.inactiveCurrencies.forEach((item) => {
      assert.isString(item)
    })
    res.body.result.marginCurrencyList.forEach((item) => {
      assert.isString(item)
    })
  })

  it('it should be successfully performed by the updateSettings method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'updateSettings',
        params: {
          settings: { 'api:testKey': { value: 'strVal' } }
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isArray(res.body.result)
    assert.isNumber(res.body.result[0])
    assert.isString(res.body.result[1])
    assert.strictEqual(res.body.result[1], 'acc_ss')
    assert.isArray(res.body.result[4])
    assert.isNumber(res.body.result[4][0])
    assert.strictEqual(res.body.result[4][0], 1)
    assert.isString(res.body.result[6])
    assert.strictEqual(res.body.result[6], 'SUCCESS')
  })

  it('it should be successfully performed by the getSettings method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getSettings',
        params: {
          keys: ['api:testKey']
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isArray(res.body.result)
    assert.isArray(res.body.result[0])
    assert.isString(res.body.result[0][0])
    assert.strictEqual(res.body.result[0][0], 'testKey')
    assert.isObject(res.body.result[0][1])
    assert.isString(res.body.result[0][1].value)
    assert.strictEqual(res.body.result[0][1].value, 'strVal')
  })

  it('it should be successfully performed by the getTickersHistory method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getTickersHistory',
        params: {
          symbol: 'BTC',
          start: 0,
          end,
          limit: 2
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isNumber(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

    assert.isObject(resItem)
    assert.containsAllKeys(resItem, [
      'symbol',
      'bid',
      'bidPeriod',
      'ask',
      'mtsUpdate'
    ])
  })

  it('it should be successfully performed by the getPositionsHistory method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getPositionsHistory',
        params: {
          symbol: 'tBTCUSD',
          start: 0,
          end,
          limit: 2
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isNumber(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

    assert.isObject(resItem)
    assert.containsAllKeys(resItem, [
      'symbol',
      'status',
      'amount',
      'basePrice',
      'marginFunding',
      'marginFundingType',
      'pl',
      'plPerc',
      'liquidationPrice',
      'leverage',
      'id',
      'mtsCreate',
      'mtsUpdate'
    ])
  })

  it('it should be successfully performed by the getPositionsSnapshot method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getPositionsSnapshot',
        params: {
          start: 0,
          end,
          limit: 2
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isNumber(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

    assert.isObject(resItem)
    assert.containsAllKeys(resItem, [
      'symbol',
      'status',
      'amount',
      'basePrice',
      'marginFunding',
      'marginFundingType',
      'pl',
      'plPerc',
      'liquidationPrice',
      'leverage',
      'id',
      'mtsCreate',
      'mtsUpdate'
    ])
  })

  it('it should be successfully performed by the getActivePositions method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getActivePositions',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isArray(res.body.result)

    const resItem = res.body.result[0]

    assert.isObject(resItem)
    assert.containsAllKeys(resItem, [
      'symbol',
      'status',
      'amount',
      'basePrice',
      'marginFunding',
      'marginFundingType',
      'pl',
      'plPerc',
      'liquidationPrice',
      'leverage',
      'id',
      'mtsCreate',
      'mtsUpdate',
      'collateral',
      'collateralMin',
      'meta'
    ])
  })

  it('it should be successfully performed by the getPositionsAudit method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getPositionsAudit',
        params: {
          id: [12345],
          symbol: 'tBTCUSD',
          start: 0,
          end,
          limit: 2
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isNumber(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

    assert.isObject(resItem)
    assert.containsAllKeys(resItem, [
      'symbol',
      'status',
      'amount',
      'basePrice',
      'marginFunding',
      'marginFundingType',
      'pl',
      'plPerc',
      'liquidationPrice',
      'leverage',
      'id',
      'mtsCreate',
      'mtsUpdate',
      'collateral',
      'collateralMin',
      'meta'
    ])
  })

  it('it should be successfully performed by the getWallets method, without params', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getWallets',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isArray(res.body.result)

    const resItem = res.body.result[0]

    assert.isObject(resItem)
    assert.containsAllKeys(resItem, [
      'type',
      'currency',
      'balance',
      'unsettledInterest',
      'balanceAvailable'
    ])
  })

  it('it should be successfully performed by the getFundingOfferHistory method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getFundingOfferHistory',
        params: {
          symbol: 'fUSD',
          start: 0,
          end,
          limit: 2
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isNumber(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

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
      'rateReal',
      'amountExecuted'
    ])
  })

  it('it should be successfully performed by the getFundingLoanHistory method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getFundingLoanHistory',
        params: {
          symbol: 'fUSD',
          start: 0,
          end,
          limit: 2
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isNumber(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

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
  })

  it('it should be successfully performed by the getFundingCreditHistory method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getFundingCreditHistory',
        params: {
          symbol: 'fUSD',
          start: 0,
          end,
          limit: 2
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isNumber(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

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
  })

  it('it should be successfully performed by the getLedgers method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getLedgers',
        params: {
          symbol: 'BTC',
          start: 0,
          end,
          limit: 2
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isNumber(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

    assert.isObject(resItem)
    assert.containsAllKeys(resItem, [
      'id',
      'currency',
      'mts',
      'amount',
      'balance',
      'description',
      'wallet'
    ])
  })

  it('it should be successfully performed by the getLedgers method, without params', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
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
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isBoolean(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

    assert.isObject(resItem)
    assert.containsAllKeys(resItem, [
      'id',
      'currency',
      'mts',
      'amount',
      'balance',
      'description',
      'wallet'
    ])
  })

  it('it should be successfully performed by the getPayInvoiceList method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getPayInvoiceList',
        params: {
          start: 0,
          end,
          limit: 2
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isNumber(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

    assert.isObject(resItem)
    assert.containsAllKeys(resItem, [
      'id',
      't',
      'duration',
      'amount',
      'currency',
      'orderId',
      'payCurrencies',
      'webhook',
      'redirectUrl',
      'status',
      'customerInfo',
      'invoices',
      'payment',
      'merchantName'
    ])
  })

  it('it should be successfully performed by the getTrades method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getTrades',
        params: {
          symbol: 'tBTCUSD',
          start: 0,
          end,
          limit: 2
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isNumber(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

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
  })

  it('it should be successfully performed by the getTrades method, where the symbol is an array', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getTrades',
        params: {
          symbol: ['tBTCUSD', 'tETHUSD'],
          start: 0,
          end,
          limit: 2
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isNumber(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

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
  })

  it('it should be successfully performed by the getTrades method, where the symbol is an array with length equal to one', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getTrades',
        params: {
          symbol: ['tBTCUSD'],
          start: 0,
          end,
          limit: 2
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isNumber(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

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
  })

  it('it should be successfully performed by the getFundingTrades method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getFundingTrades',
        params: {
          symbol: 'fBTC',
          start: 0,
          end,
          limit: 2
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isNumber(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

    assert.isObject(resItem)
    assert.containsAllKeys(resItem, [
      'id',
      'symbol',
      'mtsCreate',
      'offerID',
      'amount',
      'rate',
      'period',
      'maker'
    ])
  })

  it('it should be successfully performed by the getPublicTrades method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        method: 'getPublicTrades',
        params: {
          symbol: 'tBTCUSD',
          start: 0,
          end,
          limit: 2
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isNumber(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

    assert.isObject(resItem)
    assert.containsAllKeys(resItem, [
      'id',
      'mts',
      'amount',
      'price'
    ])
  })

  it('it should be successfully performed by the getStatusMessages method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        method: 'getStatusMessages',
        params: {
          symbol: 'tBTCF0:USTF0'
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isBoolean(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

    assert.isObject(resItem)
    assert.containsAllKeys(resItem, [
      'key',
      'timestamp',
      'price',
      'priceSpot',
      'fundBal',
      'fundingAccrued',
      'fundingStep',
      'clampMin',
      'clampMax'
    ])
  })

  it('it should be successfully performed by the getCandles method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        method: 'getCandles',
        params: {
          symbol: 'tBTCUSD',
          start: 0,
          end,
          limit: 2
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isNumber(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

    assert.isObject(resItem)
    assert.containsAllKeys(resItem, [
      'mts',
      'open',
      'close',
      'high',
      'low',
      'volume'
    ])
  })

  it('it should be successfully performed by the getPublicTrades method, where the symbol is an array with length equal to one', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        method: 'getPublicTrades',
        params: {
          symbol: ['tBTCUSD'],
          start: 0,
          end,
          limit: 2
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isNumber(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

    assert.isObject(resItem)
    assert.containsAllKeys(resItem, [
      'id',
      'mts',
      'amount',
      'price'
    ])
  })

  it('it should not be successfully performed by the getPublicTrades method, where the symbol is an array with length more then one', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        method: 'getPublicTrades',
        params: {
          symbol: ['tBTCUSD', 'tETHUSD'],
          start: 0,
          end,
          limit: 2
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(400)

    assert.isObject(res.body)
    assert.isObject(res.body.error)
    assert.propertyVal(res.body.error, 'code', 400)
    assert.isObject(res.body.error.data)
    assert.isArray(res.body.error.data.errorMetadata)
    assert.isAbove(res.body.error.data.errorMetadata.length, 0)

    res.body.error.data.errorMetadata.forEach((item) => {
      assert.isObject(item)
    })

    assert.propertyVal(res.body.error, 'message', 'Args params is not valid')
    assert.propertyVal(res.body, 'id', 5)
  })

  it('it should be successfully performed by the getOrderTrades method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getOrderTrades',
        params: {
          id: 12345,
          symbol: 'tBTCUSD',
          start: 0,
          end,
          limit: 2
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isNumber(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

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
  })

  it('it should not be successfully performed by the getOrderTrades method, where the symbol is an array', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getOrderTrades',
        params: {
          id: 12345,
          symbol: ['tBTCUSD', 'tETHUSD'],
          start: 0,
          end,
          limit: 2
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(400)

    assert.isObject(res.body)
    assert.isObject(res.body.error)
    assert.propertyVal(res.body.error, 'code', 400)
    assert.propertyVal(res.body.error, 'message', 'Args params is not valid')
    assert.propertyVal(res.body, 'id', 5)
  })

  it('it should be successfully performed by the getOrderTrades method, where the symbol is an array with length equal to one', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getOrderTrades',
        params: {
          id: 12345,
          symbol: ['tBTCUSD'],
          start: 0,
          end,
          limit: 2
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isNumber(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

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
  })

  it('it should be successfully performed by the getOrders method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getOrders',
        params: {
          symbol: 'tBTCUSD',
          start: 0,
          end,
          limit: 2
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isNumber(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

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
      'placedId',
      'amountExecuted',
      'routing',
      'meta'
    ])
  })

  it('it should be successfully performed by the getActiveOrders method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getActiveOrders',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isArray(res.body.result)

    const resItem = res.body.result[0]

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
      'placedId',
      'amountExecuted'
    ])
  })

  it('it should be successfully performed by the getMovements method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getMovements',
        params: {
          symbol: 'BTC',
          start: 0,
          end,
          limit: 2
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isNumber(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

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
      'transactionId',
      'note'
    ])
  })

  it('it should be successfully performed by the getMovements method, without params', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
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
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isBoolean(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

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
      'transactionId',
      'note'
    ])
  })

  it('it should not be successfully performed by the getMovements method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getMovements',
        params: 'isNotObject',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(400)

    assert.isObject(res.body)
    assert.isObject(res.body.error)
    assert.propertyVal(res.body.error, 'code', 400)
    assert.propertyVal(res.body.error, 'message', 'Args params is not valid')
    assert.propertyVal(res.body, 'id', 5)
  })

  it('it should be successfully performed by the getMovementInfo method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getMovementInfo',
        params: {
          id: 12345
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)

    assert.containsAllKeys(res.body.result, [
      'id',
      'currency',
      'currencyName',
      'remark',
      'mtsStarted',
      'mtsUpdated',
      'status',
      'amount',
      'fees',
      'destinationAddress',
      'memo',
      'transactionId',
      'note',
      'bankFees',
      'bankRouterId',
      'externalBankMovId',
      'externalBankMovStatus',
      'externalBankMovDescription',
      'externalBankAccInfo'
    ])
  })

  it('it should be successfully performed by the getAccountSummary method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getAccountSummary',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isArray(res.body.result)
    assert.lengthOf(res.body.result, 1)

    res.body.result.forEach((res) => {
      assert.isObject(res)
      assert.containsAllKeys(res, [
        'trade_vol_30d',
        'fees_trading_30d',
        'fees_trading_total_30d',
        'fees_funding_30d',
        'fees_funding_total_30d',
        'makerFee',
        'derivMakerRebate',
        'takerFeeToCrypto',
        'takerFeeToStable',
        'takerFeeToFiat',
        'derivTakerFee',
        'leoLev',
        'leoAmountAvg'
      ])
    })
  })

  it('it should be successfully performed by the getLogins method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getLogins',
        params: {
          start: 0,
          end,
          limit: 2
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isNumber(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

    assert.isObject(resItem)
    assert.containsAllKeys(resItem, [
      'id',
      'time',
      'ip',
      'extraData'
    ])
    assert.isObject(resItem.extraData)
  })

  it('it should be successfully performed by the getChangeLogs method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getChangeLogs',
        params: {
          start: 0,
          end,
          limit: 2
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isNumber(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

    assert.isObject(resItem)
    assert.containsAllKeys(resItem, [
      'mtsCreate',
      'log',
      'ip',
      'userAgent'
    ])
  })

  it('it should not be successfully performed by a fake method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
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

  it('it should not be successfully performed by the getLedgers method, a greater limit is needed', async function () {
    this.timeout(5000)

    await mockRESTv2Srv.close()
    mockRESTv2Srv = createMockRESTv2SrvWithAllData()

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getLedgers',
        params: {
          symbol: 'BTC',
          start: 0,
          end,
          limit: 1
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(422)

    assert.isObject(res.body)
    assert.isObject(res.body.error)
    assert.propertyVal(res.body.error, 'code', 422)
    assert.propertyVal(res.body.error, 'message', 'A greater limit is needed as to show the data correctly')
    assert.propertyVal(res.body, 'id', 5)
  })

  it('it should be successfully performed by the getMovements method, without MinLimitParamError error', async function () {
    this.timeout(5000)

    await mockRESTv2Srv.close()
    mockRESTv2Srv = createMockRESTv2SrvWithAllData()

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getMovements',
        params: {
          symbol: 'BTC',
          start: 0,
          end,
          limit: 25
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.result)
    assert.isArray(res.body.result.res)
    assert.isBoolean(res.body.result.nextPage)

    const resItem = res.body.result.res[0]

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
      'transactionId',
      'note'
    ])
  })

  it('it should be successfully performed by the getWeightedAveragesReport method', async function () {
    this.timeout(120000)

    const paramsArr = [
      { end, start, symbol: 'tBTCUSD' },
      {
        end,
        start: end - (10 * 60 * 60 * 1000),
        symbol: ['tBTCUSD']
      }
    ]

    for (const params of paramsArr) {
      const res = await agent
        .post(`${basePath}/json-rpc`)
        .type('json')
        .send({
          auth,
          method: 'getWeightedAveragesReport',
          params,
          id: 5
        })
        .expect('Content-Type', /json/)
        .expect(200)

      assert.isObject(res.body)
      assert.propertyVal(res.body, 'id', 5)
      assert.isObject(res.body.result)
      assert.isArray(res.body.result.res)
      assert.isBoolean(res.body.result.nextPage)

      const resItem = res.body.result.res[0]

      assert.isObject(resItem)
      assert.containsAllKeys(resItem, [
        'symbol',
        'buyingWeightedPrice',
        'buyingAmount',
        'cost',
        'sellingWeightedPrice',
        'sellingAmount',
        'sale',
        'cumulativeAmount',
        'firstTradeMts',
        'lastTradeMts'
      ])
    }
  })
})
