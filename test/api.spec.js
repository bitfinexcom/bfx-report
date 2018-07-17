'use strict'

const { fork } = require('child_process')
const path = require('path')
const chai = require('chai')
const request = require('supertest')
const config = require('config')

const { bootTwoGrapes, killGrapes } = require('./grenache.helper')
const { app } = require('../app')
const agent = request.agent(app)
const assert = chai.assert

let ipc = null
let grapes = null
let auth = null

const basePath = '/api'

const _checkConf = () => {
  if (
    config.has('auth') &&
    config.has('auth.apiKey') &&
    config.has('auth.apiSecret')
  ) {
    return
  }

  const err = new Error('ERR_CONFIG_ARGS_NO_AUTH')

  throw err
}

describe('API', () => {
  before(function (done) {
    this.timeout(20000)

    _checkConf()
    auth = config.get('auth')

    bootTwoGrapes((err, g) => {
      if (err) throw err

      grapes = g
      grapes[0].once('announce', msg => {
        done()
      })

      const f = path.join(__dirname, '..', 'worker.js')
      ipc = fork(f, [
        '--env=development',
        '--wtype=wrk-report-service-api',
        '--apiPort=1338'
      ], {
        stdio: ['inherit', 'inherit', 'inherit', 'ipc']
      })
    })
  })

  after(function (done) {
    this.timeout(5000)
    ipc.on('close', () => {
      killGrapes(grapes, done)
    })
    ipc.kill()
  })

  it('it should be successfully auth', function (done) {
    this.timeout(5000)
    agent
      .post(`${basePath}/check-auth`)
      .type('json')
      .send({
        auth,
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err)

        assert.isObject(res.body)
        assert.propertyVal(res.body, 'result', true)
        assert.propertyVal(res.body, 'id', 5)

        done()
      })
  })

  it('it should not be successfully auth', function (done) {
    this.timeout(5000)
    agent
      .post(`${basePath}/check-auth`)
      .type('json')
      .send({
        auth: {
          apiKey: '---',
          apiSecret: '---'
        }
      })
      .expect('Content-Type', /json/)
      .expect(401)
      .end((err, res) => {
        if (err) return done(err)

        assert.isObject(res.body)
        assert.isObject(res.body.error)
        assert.propertyVal(res.body.error, 'code', 401)
        assert.propertyVal(res.body.error, 'message', 'Unauthorized')
        assert.propertyVal(res.body, 'id', null)

        done()
      })
  })

  it('it should not be successfully auth, with an empty string', function (done) {
    this.timeout(5000)
    agent
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
      .end((err, res) => {
        if (err) return done(err)

        assert.isObject(res.body)
        assert.isObject(res.body.error)
        assert.propertyVal(res.body.error, 'code', 401)
        assert.propertyVal(res.body.error, 'message', 'Unauthorized')
        assert.propertyVal(res.body, 'id', null)

        done()
      })
  })

  it('it should be successfully performed by the getLedgers method', function (done) {
    this.timeout(5000)
    agent
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
      .end((err, res) => {
        if (err) return done(err)

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

        done()
      })
  })

  it('it should be successfully performed by the getLedgers method, without params', function (done) {
    this.timeout(5000)
    agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getLedgers',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err)

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

        done()
      })
  })

  it('it should be successfully performed by the getTrades method', function (done) {
    this.timeout(5000)
    agent
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
      .end((err, res) => {
        if (err) return done(err)

        assert.isObject(res.body)
        assert.propertyVal(res.body, 'id', 5)
        assert.isArray(res.body.result)

        if (res.body.result.length > 0) {
          let resItem = res.body.result[0]

          assert.isObject(resItem)
          assert.containsAllKeys(resItem, [
            'id',
            'pair',
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

        done()
      })
  })

  it('it should be successfully performed by the getOrders method', function (done) {
    this.timeout(5000)
    agent
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
      .end((err, res) => {
        if (err) return done(err)

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

        done()
      })
  })

  it('it should be successfully performed by the getMovements method', function (done) {
    this.timeout(5000)
    agent
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
      .end((err, res) => {
        if (err) return done(err)

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

        done()
      })
  })

  it('it should be successfully performed by the getMovements method, without params', function (done) {
    this.timeout(5000)
    agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getMovements',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err)

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

        done()
      })
  })

  it('it should not be successfully auth by the getMovements method', function (done) {
    this.timeout(5000)
    agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth: {
          apiKey: '---',
          apiSecret: '---'
        },
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
      .expect(401)
      .end((err, res) => {
        if (err) return done(err)

        assert.isObject(res.body)
        assert.isObject(res.body.error)
        assert.propertyVal(res.body.error, 'code', 401)
        assert.propertyVal(res.body.error, 'message', 'Unauthorized')
        assert.propertyVal(res.body, 'id', 5)

        done()
      })
  })

  it('it should not be successfully performed by the getMovements method', function (done) {
    this.timeout(5000)
    agent
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
      .end((err, res) => {
        if (err) return done(err)

        assert.isObject(res.body)
        assert.isObject(res.body.error)
        assert.propertyVal(res.body.error, 'code', 500)
        assert.propertyVal(res.body.error, 'message', 'Internal Server Error')
        assert.propertyVal(res.body, 'id', 5)

        done()
      })
  })

  it('it should not be successfully performed by a fake method', function (done) {
    this.timeout(5000)
    agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'fake',
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(500)
      .end((err, res) => {
        if (err) return done(err)

        assert.isObject(res.body)
        assert.isObject(res.body.error)
        assert.propertyVal(res.body.error, 'code', 500)
        assert.propertyVal(res.body.error, 'message', 'Internal Server Error')
        assert.propertyVal(res.body, 'id', 5)

        done()
      })
  })
})
