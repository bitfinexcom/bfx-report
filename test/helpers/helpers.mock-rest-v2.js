'use strict'

const { MockRESTv2Server } = require('bfx-api-mock-srv')

const _mockData = new Map([
  [
    'symbols',
    [
      'btcusd',
      'ethusd',
      'ethbtc',
      'btceur',
      'btcjpy',
      'iotusd',
      'iotbtc',
      'ioteth',
      'ifxusd',
      'ioteur',
      'euxusx'
    ]
  ],
  [
    'user_info',
    [
      null,
      'fake@email.fake',
      null
    ]
  ],
  [
    'ledgers',
    [[
      12345,
      'BTC',
      null,
      (new Date()).getTime(),
      null,
      -0.00001,
      5.555555,
      null,
      'Crypto Withdrawal fee on wallet exchange'
    ]]
  ],
  [
    'trades',
    [[
      12345,
      'tBTCUSD',
      (new Date()).getTime(),
      12345,
      0.01,
      12345,
      null,
      null,
      null,
      -0.00001,
      'BTC'
    ]]
  ],
  [
    'orders',
    [[
      12345,
      null,
      12345,
      'tBTCUSD',
      (new Date()).getTime(),
      (new Date()).getTime(),
      0,
      0.01,
      'EXCHANGE LIMIT',
      null,
      null,
      null,
      '0',
      'EXECUTED @ 15065.0(0.01)',
      null,
      null,
      12345,
      12345,
      12345,
      12345,
      null,
      null,
      null,
      0,
      null,
      null
    ]]
  ],
  [
    'movements',
    [[
      12345,
      'BTC',
      'BITCOIN',
      null,
      null,
      (new Date()).getTime(),
      (new Date()).getTime(),
      null,
      null,
      'PENDING REVIEW',
      null,
      null,
      -0.009999,
      -0.000001,
      null,
      null,
      '1riatSLRHtKNngkdXreobR76b53LETtpyT',
      null,
      null,
      null,
      null,
      null
    ]]
  ],
  [
    'f_offer_hist',
    [[
      12345,
      'fUSD',
      (new Date()).getTime(),
      (new Date()).getTime(),
      0,
      100,
      null,
      null,
      null,
      null,
      'EXECUTED at 0.7% (100.0)',
      null,
      null,
      null,
      0.007,
      7,
      false,
      false,
      null,
      false,
      null
    ]]
  ],
  [
    'f_loan_hist',
    [[
      12345,
      'fUSD',
      1,
      (new Date()).getTime(),
      (new Date()).getTime(),
      200,
      null,
      'CLOSED (used)',
      null,
      null,
      null,
      0.00168,
      30,
      null,
      null,
      false,
      false,
      null,
      false,
      null,
      false
    ]]
  ],
  [
    'f_credit_hist',
    [[
      12345,
      'fUSD',
      -1,
      (new Date()).getTime(),
      (new Date()).getTime(),
      681.25937738,
      null,
      'CLOSED (reduced)',
      null,
      null,
      null,
      0,
      2,
      null,
      null,
      false,
      false,
      null,
      false,
      null,
      false,
      null
    ]]
  ]
])

const _getMockData = (methodName) => {
  if (!_mockData.has(methodName)) throw new Error('NO_MOCKING_DATA')

  return _mockData.get(methodName)
}

const _fillAllData = (mockRESTv2Srv) => {
  for (let [key, val] of _mockData) {
    mockRESTv2Srv.setResponse(key, val)
  }
}

const _createMockRESTv2Srv = () => {
  return new MockRESTv2Server({ listen: true })
}

const createMockRESTv2SrvWithAllData = () => {
  const srv = _createMockRESTv2Srv()
  _fillAllData(srv)

  return srv
}

const _setDateTo = (key, dataItem, date = new Date()) => {
  switch (key) {
    case 'ledgers':
      dataItem[3] = date.getTime()
      break

    case 'trades':
      dataItem[2] = date.getTime()
      break

    case 'orders':
      dataItem[4] = date.getTime()
      dataItem[5] = date.getTime()
      break

    case 'movements':
      dataItem[5] = date.getTime()
      dataItem[6] = date.getTime()
      break

    case 'f_offer_hist':
      dataItem[5] = date.getTime()
      dataItem[6] = date.getTime()
      break

    case 'f_loan_hist':
      dataItem[5] = date.getTime()
      dataItem[6] = date.getTime()
      break

    case 'f_credit_hist':
      dataItem[5] = date.getTime()
      dataItem[6] = date.getTime()
      break
  }

  return dataItem
}

const createMockRESTv2SrvWithDate = (
  date = new Date(),
  opts = {
    'ledgers': { limit: 5000 },
    'trades': { limit: 1500 },
    'orders': { limit: 5000 },
    'movements': { limit: 25 },
    'f_offer_hist': { limit: 5000 },
    'f_loan_hist': { limit: 5000 },
    'f_credit_hist': { limit: 5000 }
  }
) => {
  const srv = _createMockRESTv2Srv()

  Object.entries(opts).forEach(([key, val]) => {
    const dataItem = _getMockData(key)[0].slice()

    _setDateTo(key, dataItem, date)

    const data = Array(val.limit).fill(dataItem)
    srv.setResponse(key, data)
  })

  return srv
}

module.exports = {
  createMockRESTv2SrvWithAllData,
  createMockRESTv2SrvWithDate
}
