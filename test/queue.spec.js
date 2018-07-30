'use strict'

const { promisify } = require('util')
const path = require('path')
const fs = require('fs')
const { assert } = require('chai')
const request = require('supertest')
const config = require('config')

const readdir = promisify(fs.readdir)
const unlink = promisify(fs.unlink)

const { runWorker } = require('./worker-for-tests')
const { bootTwoGrapes, killGrapes } = require('./grenache.helper')
const { app } = require('../app')
const agent = request.agent(app)

let wrkReportServiceApi = null
let grapes = null
let auth = null
let processorQueue = null

const basePath = '/api'
const tempDirPath = path.join(__dirname, '..', 'workers/loc.api/bull/temp')
const email = 'fake@mail.fake'

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
  const promisesArr = status.map(item => queue.clean(0, item))

  return Promise.all(promisesArr)
}

const _rmAllFiles = async (dir) => {
  const files = await readdir(dir)
  const promisesArr = files.map(file => unlink(path.join(dir, file)))

  return Promise.all(promisesArr)
}

const _queueToPromise = (queue) => {
  return new Promise((resolve, reject) => {
    queue.once('failed', (job, err) => {
      reject(err)
    })
    queue.once('error', (err) => {
      reject(err)
    })
    queue.once('completed', (job, result) => {
      resolve(result)
    })
  })
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

      grapes[0].once('announce', async () => {
        processorQueue = wrkReportServiceApi.bull_processor.queue

        await _cleanJobs(processorQueue)

        done()
      })
    })
  })

  after(async function () {
    this.timeout(5000)

    await _cleanJobs(processorQueue)
    await _rmAllFiles(tempDirPath)

    await new Promise((resolve) => {
      wrkReportServiceApi.stop(() => {
        killGrapes(grapes, resolve)
      })
    })
  })

  it('it should be successfully performed by the getLedgersCsv method', async function () {
    this.timeout(60000)

    const proccPromise = _queueToPromise(processorQueue)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getLedgersCsv',
        params: {
          symbol: 'BTC',
          end: (new Date()).getTime(),
          start: (new Date()).setDate((new Date()).getDate() - 90),
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
    assert.property(proccRes, 'filePath')
    assert.property(proccRes, 'email')
    assert.isString(proccRes.filePath)
    assert.isString(proccRes.email)
    assert.isOk(fs.existsSync(proccRes.filePath))
  })

  it('it should be successfully performed by the getTradesCsv method', async function () {
    this.timeout(60000)

    const proccPromise = _queueToPromise(processorQueue)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getTradesCsv',
        params: {
          symbol: 'tBTCUSD',
          end: (new Date()).getTime(),
          start: (new Date()).setDate((new Date()).getDate() - 90),
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
    assert.property(proccRes, 'filePath')
    assert.property(proccRes, 'email')
    assert.isString(proccRes.filePath)
    assert.isString(proccRes.email)
    assert.isOk(fs.existsSync(proccRes.filePath))
  })

  it('it should be successfully performed by the getOrdersCsv method', async function () {
    this.timeout(60000)

    const proccPromise = _queueToPromise(processorQueue)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getOrdersCsv',
        params: {
          symbol: 'tBTCUSD',
          end: (new Date()).getTime(),
          start: (new Date()).setDate((new Date()).getDate() - 90),
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
    assert.property(proccRes, 'filePath')
    assert.property(proccRes, 'email')
    assert.isString(proccRes.filePath)
    assert.isString(proccRes.email)
    assert.isOk(fs.existsSync(proccRes.filePath))
  })

  it('it should be successfully performed by the getMovementsCsv method', async function () {
    this.timeout(60000)

    const proccPromise = _queueToPromise(processorQueue)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth,
        method: 'getMovementsCsv',
        params: {
          symbol: 'BTC',
          end: (new Date()).getTime(),
          start: (new Date()).setDate((new Date()).getDate() - 90),
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
    assert.property(proccRes, 'filePath')
    assert.property(proccRes, 'email')
    assert.isString(proccRes.filePath)
    assert.isString(proccRes.email)
    assert.isOk(fs.existsSync(proccRes.filePath))
  })

  it('it should not be successfully auth by the getLedgersCsv method', async function () {
    this.timeout(60000)

    const proccPromise = _queueToPromise(processorQueue)

    const res = await agent
      .post(`${basePath}/get-data`)
      .type('json')
      .send({
        auth: {
          apiKey: '---',
          apiSecret: '---'
        },
        method: 'getLedgersCsv',
        params: {
          symbol: 'BTC',
          end: (new Date()).getTime(),
          start: (new Date()).setDate((new Date()).getDate() - 90),
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
      await proccPromise
      assert(false, 'The queue must not completed')
    } catch (err) {
      assert.include(err.toString(), 'apikey: digest invalid')
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
          end: (new Date()).getTime(),
          start: (new Date()).setDate((new Date()).getDate() - 90)
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
