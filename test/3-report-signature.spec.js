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
  queueToPromise
} = require('./helpers/helpers.core')
const {
  createMockRESTv2SrvWithDate
} = require('./helpers/helpers.mock-rest-v2')
const {
  testMethodOfGettingReportFile
} = require('./helpers/helpers.tests')

const signature = `-----BEGIN PGP SIGNATURE-----
Version: OpenPGP.js v4.5.2
Comment: https://openpgpjs.org

wl4EARYKAAYFAlzr1kMACgkQFh7gOz3Qo1Pe5QEAkpPma81YUttJNEK7zPfF
cvJxqAW4w9Crfobqk+wvb3cA/07ej6osCli0twWcNtDw6YkWiip+IT0+SMOH
08ODZ/ED
=hXVs
-----END PGP SIGNATURE-----`
const fileHash = 'bdb9d457ab0e29806e7291bdb9d7fd17c90dad665cf437122b881cc57041899b'

process.env.NODE_CONFIG_DIR = path.join(__dirname, 'config')
const { app } = require('bfx-report-express')
const agent = request.agent(app)

let wrkReportServiceApi = null
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
const auth = {
  apiKey: 'fake',
  apiSecret: 'fake'
}

describe('Signature', () => {
  before(async function () {
    this.timeout(20000)

    mockRESTv2Srv = createMockRESTv2SrvWithDate(start, end, 10000)

    await rmAllFiles(tempDirPath)
    await rmDB(dbDirPath)
    const env = await startEnvironment()

    wrkReportServiceApi = env.wrksReportServiceApi[0]
    processorQueue = wrkReportServiceApi.lokue_processor.q
    aggregatorQueue = wrkReportServiceApi.lokue_aggregator.q
  })

  after(async function () {
    this.timeout(5000)

    await stopEnvironment()
    await rmDB(dbDirPath)
    await rmAllFiles(tempDirPath)

    try {
      await mockRESTv2Srv.close()
    } catch (err) { }
  })

  it('it should be successfully performed by the getMultipleCsv method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(processorQueue)
    const aggrPromise = queueToPromise(aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getMultipleCsv',
        params: {
          email,
          isSignatureRequired: true,
          multiExport: [
            {
              method: 'getTradesCsv',
              symbol: ['tBTCUSD', 'tETHUSD'],
              end,
              start,
              limit: 1000,
              timezone: 'America/Los_Angeles'
            },
            {
              method: 'getTickersHistoryCsv',
              symbol: 'BTC',
              end,
              start,
              limit: 1000
            }
          ]
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should be successfully performed by the getLedgersCsv method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(processorQueue)
    const aggrPromise = queueToPromise(aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getLedgersCsv',
        params: {
          symbol: ['BTC'],
          end,
          start,
          limit: 1000,
          timezone: -3,
          email,
          isSignatureRequired: true
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should be successfully performed by the verifyDigitalSignature method', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'verifyDigitalSignature',
        signature,
        fileHash,
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isOk(res)
  })

  // TODO: The feature is pending
  it.skip('it should be successfully performed by the /verify-digital-signature route', async function () {
    this.timeout(5000)

    const res = await agent
      .post(`${basePath}/verify-digital-signature`)
      .attach('file', Buffer.from('some report', 'utf8'), 'some-report.json')
      .field({ signature })
      .expect('Content-Type', /json/)
      .expect(200)

    assert.isOk(res)
  })
})
