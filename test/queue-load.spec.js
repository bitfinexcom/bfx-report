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
  queuesToPromiseMulti,
  asyncForEach
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
const tempDirPath = path.join(__dirname, '..', 'workers/loc.api/bull/temp')
const email = 'fake@mail.fake'
const date = new Date()
const end = date.getTime()
const start = (new Date()).setDate(date.getDate() - 90)

describe('Queue load', () => {
  before(async function () {
    this.timeout(20000)

    mockRESTv2Srv = createMockRESTv2SrvWithDate(date)

    const env = await startEnviroment(false, false, 8)
    wrksReportServiceApi = env.wrksReportServiceApi

    await asyncForEach(wrksReportServiceApi, async wrk => {
      const procQ = wrk.bull_processor.queue
      const aggrQ = wrk.bull_aggregator.queue

      processorQueues.push(procQ)
      aggregatorQueues.push(aggrQ)

      await cleanJobs(procQ)
      await cleanJobs(aggrQ)
    })
  })

  after(async function () {
    this.timeout(5000)

    await asyncForEach(processorQueues, async queue => {
      await cleanJobs(queue)
    })
    await asyncForEach(aggregatorQueues, async queue => {
      await cleanJobs(queue)
    })
    await rmAllFiles(tempDirPath)
    await stopEnviroment()

    try {
      await mockRESTv2Srv.close()
    } catch (err) { }
  })

  it('it should be successfully performed by the getLedgersCsv method, with 100 users', async function () {
    this.timeout(5 * 60000)

    const count = 100
    const procPromise = queuesToPromiseMulti(
      processorQueues,
      count,
      procRes => {
        assert.isObject(procRes)
        assert.property(procRes, 'filePath')
        assert.property(procRes, 'email')
        assert.isString(procRes.filePath)
        assert.isString(procRes.email)
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
            limit: 10000, // TODO:
            email
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
