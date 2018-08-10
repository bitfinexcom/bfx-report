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
  queuesToPromiseMulti
} = require('./helpers/helpers.core')
const { createMockRESTv2SrvWithDate } = require('./helpers/helpers.mock-rest-v2')

const { app } = require('../app')
const agent = request.agent(app)

let wrksReportServiceApi = []
let auth = {
  apiKey: 'fake',
  apiSecret: 'fake'
}
let processorQueues = []
let aggregatorQueues = []
let mockRESTv2Srv = null

const basePath = '/api'
const tempDirPath = path.join(__dirname, '..', 'workers/loc.api/queue/temp')
const dbDirPath = path.join(__dirname, '..', 'db')
const date = new Date()
const end = date.getTime()
const start = (new Date()).setDate(date.getDate() - 90)

describe('Queue load', () => {
  before(async function () {
    this.timeout(20000)

    mockRESTv2Srv = createMockRESTv2SrvWithDate(date)

    await rmAllFiles(tempDirPath)
    await rmDB(dbDirPath)
    const env = await startEnviroment(false, false, 8)

    wrksReportServiceApi = env.wrksReportServiceApi

    wrksReportServiceApi.forEach(wrk => {
      processorQueues.push(wrk.lokue_processor.q)
      aggregatorQueues.push(wrk.lokue_aggregator.q)
    })
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

  it('it should be successfully performed by the getLedgersCsv method, with 100 users', async function () {
    this.timeout(10 * 60000)

    const count = 100
    const procPromise = queuesToPromiseMulti(
      processorQueues,
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
        assert.isString(procRes.email)
        assert.isFinite(procRes.endDate)
        assert.isFinite(procRes.startDate)
        assert.isBoolean(procRes.isUnauth)
        assert.isOk(fs.existsSync(procRes.filePath))
      }
    )
    const aggrPromise = queuesToPromiseMulti(aggregatorQueues, count)

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
            limit: 10000
          },
          id: 5
        })
        .expect('Content-Type', /json/)
        .expect(200)

      assert.isObject(res.body)
      assert.propertyVal(res.body, 'id', 5)
      assert.isOk(res.body.result)
    }

    await procPromise
    await aggrPromise
  })
})
