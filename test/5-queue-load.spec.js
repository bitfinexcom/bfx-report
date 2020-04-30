'use strict'

const path = require('path')
const { assert } = require('chai')
const request = require('supertest')

const {
  startEnvironment,
  stopEnvironment
} = require('./helpers/helpers.boot')
const {
  rmDB,
  rmAllFiles,
  ipcsToPromiseMulti
} = require('./helpers/helpers.core')
const {
  createMockRESTv2SrvWithDate
} = require('./helpers/helpers.mock-rest-v2')
const {
  testProcQueue
} = require('./helpers/helpers.tests')

process.env.NODE_CONFIG_DIR = path.join(__dirname, 'config')
const { app } = require('bfx-report-express')
const agent = request.agent(app)

const ipcs = []
let mockRESTv2Srv = null

const serviceTest = path.join(__dirname, 'helpers/helpers.queue-load.js')
const basePath = '/api'
const tempDirPath = path.join(__dirname, '..', 'workers/loc.api/queue/temp')
const dbDirPath = path.join(__dirname, '..', 'db')
const date = new Date()
const end = date.getTime()
const start = (new Date()).setDate(date.getDate() - 90)
const email = 'fake@email.fake'
const limit = 10000
const auth = {
  apiKey: 'fake',
  apiSecret: 'fake'
}

describe('Queue load', () => {
  before(async function () {
    this.timeout(20000)

    mockRESTv2Srv = createMockRESTv2SrvWithDate(start, end, null, {
      ledgers: { limit },
      user_info: null
    })

    await rmAllFiles(tempDirPath)
    await rmDB(dbDirPath)

    const env = await startEnvironment(
      false,
      true,
      8,
      {},
      serviceTest
    )

    ipcs.push(...env.wrkIpcs)
  })

  after(async function () {
    this.timeout(10000)

    await stopEnvironment()
    await rmDB(dbDirPath)
    await rmAllFiles(tempDirPath)

    try {
      await mockRESTv2Srv.close()
    } catch (err) { }
  })

  it('it should be successfully performed by the getLedgersCsv method, with 100 users', async function () {
    this.timeout(10 * 60000)

    const count = 100
    const procPromise = ipcsToPromiseMulti(
      'processor',
      ipcs,
      count,
      testProcQueue
    )
    const aggrPromise = ipcsToPromiseMulti(
      'aggregator',
      ipcs,
      count
    )

    for (let i = 0; i < count; i += 1) {
      const res = await agent
        .post(`${basePath}/json-rpc`)
        .type('json')
        .send({
          auth,
          method: 'getLedgersCsv',
          params: {
            symbol: 'BTC',
            end,
            start,
            limit,
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
