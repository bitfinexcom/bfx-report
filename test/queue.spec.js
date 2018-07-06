'use strict'

const { fork } = require('child_process')
const path = require('path')
const fs = require('fs')
const { assert } = require('chai')
const request = require('supertest')
const config = require('config')
const { runWorker } = require('./worker-for-tests')

const { bootTwoGrapes, killGrapes } = require('../workers/grenache.helper')
const { app } = require('../app')
const agent = request.agent(app)

let wrkReportServiceApi = null
let ipcTestCall = null
let ipcS3 = null
let ipcSendgrid = null
let grapes = null
let auth = null
let email = 'fake@email.test'
let processorQueue = null
let aggregatorQueue = null

const basePath = '/api'

const _checkConf = () => {
  if (
    config.has('auth') &&
    config.has('auth.apiKey') &&
    typeof config.get('auth.apiKey') === 'string' &&
    config.get('auth.apiKey') &&
    config.has('auth.apiSecret') &&
    typeof config.get('auth.apiSecret') === 'string' &&
    config.get('auth.apiSecret')
  ) {
    return
  }

  const err = new Error('ERR_CONFIG_ARGS_NO_AUTH')

  throw err
}

const _cleanJobs = async (
  queue,
  status = ['completed', 'active', 'failed', 'wait', 'delayed']
) => {
  const promiseArr = status.map(item => queue.clean(0, item))

  return Promise.all(promiseArr)
}

describe('Queue', () => {
  before(function (done) {
    this.timeout(20000)

    _checkConf()
    auth = config.get('auth')

    bootTwoGrapes((err, g) => {
      if (err) throw err

      grapes = g

      wrkReportServiceApi = runWorker({
        wtype: 'wrk-report-service-api',
        apiPort: 1338
      })
      ipcTestCall = fork(
        path.join(__dirname, 'simulate/bfx-ext-testcalls-js/worker.js'),
        ['--env=development', '--wtype=wrk-ext-testcalls-api', '--apiPort=1339'],
        {
          stdio: ['inherit', 'inherit', 'inherit', 'ipc']
        }
      )
      ipcS3 = fork(
        path.join(__dirname, 'simulate/bfx-ext-s3-js/worker.js'),
        ['--env=development', '--wtype=wrk-ext-s3-api', '--apiPort=1340'],
        {
          stdio: ['inherit', 'inherit', 'inherit', 'ipc']
        }
      )
      ipcSendgrid = fork(
        path.join(__dirname, 'simulate/bfx-ext-sendgrid-js/worker.js'),
        ['--env=development', '--wtype=wrk-ext-sendgrid-api', '--apiPort=1341'],
        {
          stdio: ['inherit', 'inherit', 'inherit', 'ipc']
        }
      )

      grapes[0].once('announce', async () => {
        processorQueue = wrkReportServiceApi.bull_processor.queue
        aggregatorQueue = wrkReportServiceApi.bull_aggregator.queue

        await _cleanJobs(processorQueue)
        await _cleanJobs(aggregatorQueue)

        done()
      })
    })
  })

  after(async function () {
    this.timeout(5000)

    const promiseKill = new Promise((resolve, reject) => {
      ipcTestCall.on('close', () => {
        process.nextTick(() => {
          wrkReportServiceApi.stop(() => {
            killGrapes(grapes, resolve)
          })
        })
      })
    })

    ipcS3.on('close', () => {
      process.nextTick(() => {
        ipcTestCall.kill()
      })
    })

    ipcSendgrid.on('close', () => {
      process.nextTick(() => {
        ipcS3.kill()
      })
    })

    await _cleanJobs(processorQueue)
    await _cleanJobs(aggregatorQueue)

    ipcSendgrid.kill()

    await promiseKill
  })

  it('it should be successfully performed by the getLedgersCsv method', async function () {
    this.timeout(60000)

    processorQueue.once('failed', (job, err) => {
      throw err
    })
    aggregatorQueue.once('failed', (job, err) => {
      throw err
    })

    const proccPromise = new Promise((resolve, reject) => {
      processorQueue.once('completed', (job, result) => {
        resolve(result)
      })
    })
    const aggrPromise = new Promise((resolve, reject) => {
      aggregatorQueue.once('completed', (job, result) => {
        resolve(result)
      })
    })

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getLedgersCsv',
        params: {
          symbol: 'BTC',
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isOk(res.body.result)

    const proccRes = await proccPromise

    assert.isObject(proccRes)
    assert.property(proccRes, 'fileName')
    assert.isString(proccRes.fileName)
    assert.isOk(fs.existsSync(proccRes.fileName))
    assert.propertyVal(proccRes, 'email', email)

    const aggrRes = await aggrPromise

    assert.isObject(aggrRes)
    assert.property(aggrRes, 'statusCode')
    assert.isAtLeast(aggrRes.statusCode, 200)
    assert.isBelow(aggrRes.statusCode, 300)
    assert.isNotOk(fs.existsSync(proccRes.fileName))
  })

  it('it should be successfully performed by the getTradesCsv method', async function () {
    this.timeout(60000)

    processorQueue.once('failed', (job, err) => {
      throw err
    })
    aggregatorQueue.once('failed', (job, err) => {
      throw err
    })

    const proccPromise = new Promise((resolve, reject) => {
      processorQueue.once('completed', (job, result) => {
        resolve(result)
      })
    })
    const aggrPromise = new Promise((resolve, reject) => {
      aggregatorQueue.once('completed', (job, result) => {
        resolve(result)
      })
    })

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getTradesCsv',
        params: {
          symbol: 'tBTCUSD',
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isOk(res.body.result)

    const proccRes = await proccPromise

    assert.isObject(proccRes)
    assert.property(proccRes, 'fileName')
    assert.isString(proccRes.fileName)
    assert.isOk(fs.existsSync(proccRes.fileName))
    assert.propertyVal(proccRes, 'email', email)

    const aggrRes = await aggrPromise

    assert.isObject(aggrRes)
    assert.property(aggrRes, 'statusCode')
    assert.isAtLeast(aggrRes.statusCode, 200)
    assert.isBelow(aggrRes.statusCode, 300)
    assert.isNotOk(fs.existsSync(proccRes.fileName))
  })

  it('it should be successfully performed by the getOrdersCsv method', async function () {
    this.timeout(60000)

    processorQueue.once('failed', (job, err) => {
      throw err
    })
    aggregatorQueue.once('failed', (job, err) => {
      throw err
    })

    const proccPromise = new Promise((resolve, reject) => {
      processorQueue.once('completed', (job, result) => {
        resolve(result)
      })
    })
    const aggrPromise = new Promise((resolve, reject) => {
      aggregatorQueue.once('completed', (job, result) => {
        resolve(result)
      })
    })

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getOrdersCsv',
        params: {
          symbol: 'tBTCUSD',
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isOk(res.body.result)

    const proccRes = await proccPromise

    assert.isObject(proccRes)
    assert.property(proccRes, 'fileName')
    assert.isString(proccRes.fileName)
    assert.isOk(fs.existsSync(proccRes.fileName))
    assert.propertyVal(proccRes, 'email', email)

    const aggrRes = await aggrPromise

    assert.isObject(aggrRes)
    assert.property(aggrRes, 'statusCode')
    assert.isAtLeast(aggrRes.statusCode, 200)
    assert.isBelow(aggrRes.statusCode, 300)
    assert.isNotOk(fs.existsSync(proccRes.fileName))
  })

  it('it should be successfully performed by the getMovementsCsv method', async function () {
    this.timeout(60000)

    processorQueue.once('failed', (job, err) => {
      throw err
    })
    aggregatorQueue.once('failed', (job, err) => {
      throw err
    })

    const proccPromise = new Promise((resolve, reject) => {
      processorQueue.once('completed', (job, result) => {
        resolve(result)
      })
    })
    const aggrPromise = new Promise((resolve, reject) => {
      aggregatorQueue.once('completed', (job, result) => {
        resolve(result)
      })
    })

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getMovementsCsv',
        params: {
          symbol: 'BTC',
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isOk(res.body.result)

    const proccRes = await proccPromise

    assert.isObject(proccRes)
    assert.property(proccRes, 'fileName')
    assert.isString(proccRes.fileName)
    assert.isOk(fs.existsSync(proccRes.fileName))
    assert.propertyVal(proccRes, 'email', email)

    const aggrRes = await aggrPromise

    assert.isObject(aggrRes)
    assert.property(aggrRes, 'statusCode')
    assert.isAtLeast(aggrRes.statusCode, 200)
    assert.isBelow(aggrRes.statusCode, 300)
    assert.isNotOk(fs.existsSync(proccRes.fileName))
  })

  it('it should not be successfully auth by the getLedgersCsv method', async function () {
    this.timeout(60000)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth: {
          apiKey: '',
          apiSecret: ''
        },
        method: 'getLedgersCsv',
        params: {
          symbol: 'BTC',
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(401)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isNotOk(res.body.result)
    assert.isObject(res.body.error)
    assert.propertyVal(res.body.error, 'code', 401)
    assert.propertyVal(res.body.error, 'message', 'Unauthorized')
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
          symbol: 'BTC'
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
