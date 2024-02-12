'use strict'

const { assert } = require('chai')

const {
  queueToPromise,
  queueToPromiseMulti
} = require('../helpers/helpers.core')
const {
  testMethodOfGettingReportFile,
  testProcQueue
} = require('../helpers/helpers.tests')

module.exports = (
  agent,
  params = {}
) => {
  const {
    mockDataAmount,
    basePath,
    auth,
    email,
    date,
    end,
    start,
    isPDFRequired
  } = params

  it('it should be successfully performed by the getMultipleFile method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(params.processorQueue)
    const aggrPromise = queueToPromise(params.aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getMultipleFile',
        params: {
          email,
          language: 'ru',
          isPDFRequired,
          multiExport: [
            {
              method: 'getTradesFile',
              symbol: ['tBTCUSD', 'tETHUSD'],
              end,
              start,
              limit: 1000,
              timezone: 'America/Los_Angeles'
            },
            {
              method: 'getTickersHistoryFile',
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

  it('it should not be successfully performed by the getMultipleFile method', async function () {
    this.timeout(60000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getMultipleFile',
        params: {
          email,
          isPDFRequired,
          multiExport: [
            {
              symbol: ['tBTCUSD', 'tETHUSD'],
              end,
              start,
              limit: 1000,
              timezone: 'America/Los_Angeles'
            }
          ]
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

  it('it should be successfully performed by the getTickersHistoryFile method', async function () {
    this.timeout(60000)

    // TODO: Wait for implementation of pdf template in the next release
    if (isPDFRequired) {
      this.skip()
    }

    const procPromise = queueToPromise(params.processorQueue)
    const aggrPromise = queueToPromise(params.aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getTickersHistoryFile',
        params: {
          isPDFRequired,
          symbol: 'BTC',
          end,
          start,
          limit: 1000,
          email,
          language: 'zh-TW'
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should be successfully performed by the getPositionsHistoryFile method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(params.processorQueue)
    const aggrPromise = queueToPromise(params.aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getPositionsHistoryFile',
        params: {
          isPDFRequired,
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

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should be successfully performed by the getActivePositionsFile method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(params.processorQueue)
    const aggrPromise = queueToPromise(params.aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getActivePositionsFile',
        params: {
          isPDFRequired,
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should be successfully performed by the getPositionsAuditFile method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(params.processorQueue)
    const aggrPromise = queueToPromise(params.aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getPositionsAuditFile',
        params: {
          isPDFRequired,
          id: [12345],
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

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should be successfully performed by the getWalletsFile method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(params.processorQueue)
    const aggrPromise = queueToPromise(params.aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getWalletsFile',
        params: {
          isPDFRequired,
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should be successfully performed by the getFundingOfferHistoryFile method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(params.processorQueue)
    const aggrPromise = queueToPromise(params.aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getFundingOfferHistoryFile',
        params: {
          isPDFRequired,
          symbol: 'fUSD',
          end,
          start,
          limit: 1000,
          email,
          milliseconds: true
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should be successfully performed by the getFundingLoanHistoryFile method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(params.processorQueue)
    const aggrPromise = queueToPromise(params.aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getFundingLoanHistoryFile',
        params: {
          isPDFRequired,
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

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should be successfully performed by the getFundingCreditHistoryFile method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(params.processorQueue)
    const aggrPromise = queueToPromise(params.aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getFundingCreditHistoryFile',
        params: {
          isPDFRequired,
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

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should be successfully performed by the getLedgersFile method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(params.processorQueue)
    const aggrPromise = queueToPromise(params.aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getLedgersFile',
        params: {
          isPDFRequired,
          symbol: ['BTC'],
          end,
          start,
          limit: 1000,
          timezone: -3,
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should be successfully performed by the getPayInvoiceListFile method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(params.processorQueue)
    const aggrPromise = queueToPromise(params.aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getPayInvoiceListFile',
        params: {
          isPDFRequired,
          end,
          start,
          limit: 100,
          timezone: -3,
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should be successfully performed by the getTradesFile method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(params.processorQueue)
    const aggrPromise = queueToPromise(params.aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getTradesFile',
        params: {
          isPDFRequired,
          symbol: ['tBTCUSD', 'tETHUSD'],
          end,
          start,
          limit: 1000,
          timezone: 'America/Los_Angeles',
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should be successfully performed by the getFundingTradesFile method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(params.processorQueue)
    const aggrPromise = queueToPromise(params.aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getFundingTradesFile',
        params: {
          isPDFRequired,
          symbol: ['fBTC'],
          end,
          start,
          limit: 1000,
          timezone: 'America/Los_Angeles',
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should be successfully performed by the getStatusMessagesFile method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(params.processorQueue)
    const aggrPromise = queueToPromise(params.aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getStatusMessagesFile',
        params: {
          isPDFRequired,
          symbol: ['tBTCF0:USTF0'],
          timezone: 'America/Los_Angeles',
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should be successfully performed by the getPublicTradesFile method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(params.processorQueue)
    const aggrPromise = queueToPromise(params.aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getPublicTradesFile',
        params: {
          isPDFRequired,
          symbol: 'tBTCUSD',
          end,
          start: (new Date()).setDate(date.getDate() - 27),
          limit: 1000,
          timezone: 'America/Los_Angeles',
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should be successfully performed by the getCandlesFile method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(params.processorQueue)
    const aggrPromise = queueToPromise(params.aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getCandlesFile',
        params: {
          isPDFRequired,
          symbol: 'tBTCUSD',
          end,
          start: (new Date()).setDate(date.getDate() - 27),
          limit: 1000,
          timezone: 'America/Los_Angeles',
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should not be successfully performed by the getPublicTradesFile method, time frame more then a month', async function () {
    this.timeout(60000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getPublicTradesFile',
        params: {
          isPDFRequired,
          symbol: 'tBTCUSD',
          end,
          start,
          limit: 1000,
          timezone: 'America/Los_Angeles',
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(422)

    assert.isObject(res.body)
    assert.isObject(res.body.error)
    assert.propertyVal(res.body.error, 'code', 422)
    assert.propertyVal(res.body.error, 'message', 'For public trades export please select a time frame smaller than a month')
    assert.propertyVal(res.body, 'id', 5)
  })

  it('it should not be successfully performed by the getPublicTradesFile method, with symbol array', async function () {
    this.timeout(60000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getPublicTradesFile',
        params: {
          isPDFRequired,
          symbol: ['tBTCUSD', 'tETHUSD'],
          end,
          start,
          limit: 1000,
          timezone: 'America/Los_Angeles',
          email
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

  it('it should be successfully performed by the getOrderTradesFile method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(params.processorQueue)
    const aggrPromise = queueToPromise(params.aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getOrderTradesFile',
        params: {
          isPDFRequired,
          id: 12345,
          symbol: 'tBTCUSD',
          end,
          start,
          limit: 1000,
          timezone: 'America/Los_Angeles',
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should be successfully performed by the getOrdersFile method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(params.processorQueue)
    const aggrPromise = queueToPromise(params.aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getOrdersFile',
        params: {
          isPDFRequired,
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

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should be successfully performed by the getActiveOrdersFile method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(params.processorQueue)
    const aggrPromise = queueToPromise(params.aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getActiveOrdersFile',
        params: {
          isPDFRequired,
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should be successfully performed by the getMovementsFile method', async function () {
    this.timeout(3 * 60000)

    const procPromise = queueToPromise(params.processorQueue)
    const aggrPromise = queueToPromise(params.aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getMovementsFile',
        params: {
          isPDFRequired,
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

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should be successfully performed by the getMovementsFile method, where amount > 0', async function () {
    this.timeout(3 * 60000)

    const procPromise = queueToPromise(params.processorQueue)
    const aggrPromise = queueToPromise(params.aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getMovementsFile',
        params: {
          isPDFRequired,
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

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should be successfully performed by the getMovementsFile method, where amount < 0', async function () {
    this.timeout(3 * 60000)

    const procPromise = queueToPromise(params.processorQueue)
    const aggrPromise = queueToPromise(params.aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getMovementsFile',
        params: {
          isPDFRequired,
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

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should be successfully performed by the getLoginsFile method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(params.processorQueue)
    const aggrPromise = queueToPromise(params.aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getLoginsFile',
        params: {
          isPDFRequired,
          end,
          start,
          limit: 1000,
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should be successfully performed by the getChangeLogsFile method', async function () {
    this.timeout(60000)

    const procPromise = queueToPromise(params.processorQueue)
    const aggrPromise = queueToPromise(params.aggregatorQueue)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getChangeLogsFile',
        params: {
          isPDFRequired,
          end,
          start,
          limit: 1000,
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should be successfully performed by the getWeightedAveragesReportFile method', async function () {
    this.timeout(60000)

    // TODO: Wait for implementation of pdf template in the next release
    if (isPDFRequired) {
      this.skip()
    }

    const procPromise = queueToPromise(params.processorQueue)
    const aggrPromise = queueToPromise(params.aggregatorQueue)

    const _start = end - ((end - start) / (mockDataAmount / 2000))

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        auth,
        method: 'getWeightedAveragesReportFile',
        params: {
          isPDFRequired,
          symbol: 'tBTCUSD',
          end,
          start: _start,
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)

    await testMethodOfGettingReportFile(procPromise, aggrPromise, res)
  })

  it('it should not be successfully auth by the getLedgersFile method', async function () {
    this.timeout(60000)

    const res = await agent
      .post(`${basePath}/json-rpc`)
      .type('json')
      .send({
        method: 'getLedgersFile',
        params: {
          isPDFRequired,
          symbol: 'BTC',
          end,
          start,
          limit: 10000,
          email
        },
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(401)

    assert.isObject(res.body)
    assert.propertyVal(res.body, 'id', 5)
    assert.isObject(res.body.error)
    assert.containsAllKeys(res.body.error, [
      'code',
      'message'
    ])
  })

  it('it should be successfully performed by the getLedgersFile method, with multiple users', async function () {
    this.timeout(5 * 60000)

    const count = 10
    const procPromise = queueToPromiseMulti(
      params.processorQueue,
      count,
      testProcQueue
    )
    const aggrPromise = queueToPromiseMulti(params.aggregatorQueue, count)

    for (let i = 0; i < count; i += 1) {
      const res = await agent
        .post(`${basePath}/json-rpc`)
        .type('json')
        .send({
          auth,
          method: 'getLedgersFile',
          params: {
            isPDFRequired,
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
}
