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
      123,
      'fake@email.fake',
      'fakename',
      null,
      null,
      null,
      null,
      'Kyiv'
    ]
  ],
  [
    'wallets',
    [[
      'margin',
      'BTC',
      -0.04509854,
      null,
      null
    ]]
  ],
  [
    'wallets_hist',
    [[
      'margin',
      'BTC',
      -0.04509854,
      null,
      null,
      null,
      (new Date()).getTime()
    ]]
  ],
  [
    'positions_hist',
    [[
      'tBTCUSD',
      'ACTIVE',
      0.1,
      16500,
      0,
      0,
      null,
      null,
      null,
      null,
      null,
      12345,
      (new Date()).getTime(),
      (new Date()).getTime()
    ]]
  ],
  [
    'positions_audit',
    [[
      'tBTCUSD',
      'ACTIVE',
      0.1,
      16500,
      0,
      0,
      null,
      null,
      null,
      null,
      null,
      12345,
      (new Date()).getTime(),
      (new Date()).getTime()
    ]]
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
      false,
      -0.00001,
      'BTC'
    ]]
  ],
  [
    'public_trades',
    [[
      12345,
      (new Date()).getTime(),
      0.01,
      12345
    ]]
  ],
  [
    'orders',
    [[
      12345,
      12345,
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
      false,
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
      '0x047633e8e976dc13a81ac3e45564f6b83d10aeb9',
      null,
      null,
      null,
      '0x754687b3cbee7cdc4b29107e325455c682dfc320ca0c4233c313263a27282760',
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
  ],
  [
    'currencies',
    [
      ['USD', 'US Dollar'],
      ['BTC', 'Bitcoin'],
      ['LTC', 'Litecoin'],
      ['DSH', 'Dash'],
      ['ETH', 'Ethereum']
    ]
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

const _setDataTo = (
  key,
  dataItem,
  data = {
    date: new Date().getTime(),
    id: 12345,
    fee: 0.1
  }
) => {
  const _date = Math.round(data.date)

  switch (key) {
    case 'wallets_hist':
      dataItem[6] = _date
      break

    case 'positions_hist':
      dataItem[11] = data.id
      dataItem[12] = _date
      dataItem[13] = _date
      break

    case 'positions_audit':
      dataItem[11] = data.id
      dataItem[12] = _date
      dataItem[13] = _date
      break

    case 'ledgers':
      dataItem[0] = data.id
      dataItem[3] = _date
      break

    case 'trades':
      dataItem[0] = data.id
      dataItem[2] = _date
      dataItem[3] = data.id
      dataItem[9] = data.fee
      break

    case 'public_trades':
      dataItem[0] = data.id
      dataItem[1] = _date
      break

    case 'orders':
      dataItem[0] = data.id
      dataItem[4] = _date
      dataItem[5] = _date
      break

    case 'movements':
      dataItem[0] = data.id
      dataItem[5] = _date
      dataItem[6] = _date
      break

    case 'f_offer_hist':
      dataItem[0] = data.id
      dataItem[2] = _date
      dataItem[3] = _date
      break

    case 'f_loan_hist':
      dataItem[0] = data.id
      dataItem[3] = _date
      dataItem[4] = _date
      break

    case 'f_credit_hist':
      dataItem[0] = data.id
      dataItem[3] = _date
      dataItem[4] = _date
      break
  }

  return dataItem
}

const createMockRESTv2SrvWithDate = (
  start = new Date().getTime(),
  end = start,
  limit = null,
  opts = {
    'wallets_hist': { limit: 100 },
    'wallets': { limit: 100 },
    'positions_hist': { limit: 500 },
    'positions_audit': { limit: 1250 },
    'ledgers': { limit: 5000 },
    'trades': { limit: 1500 },
    'public_trades': { limit: 1000 },
    'orders': { limit: 5000 },
    'movements': { limit: 25 },
    'f_offer_hist': { limit: 5000 },
    'f_loan_hist': { limit: 5000 },
    'f_credit_hist': { limit: 5000 },
    'user_info': null,
    'symbols': null,
    'currencies': null
  }
) => {
  const srv = _createMockRESTv2Srv()

  Object.entries(opts).forEach(([key, val]) => {
    if (
      !Array.isArray(_getMockData(key)[0]) ||
      val === null
    ) {
      srv.setResponse(key, _getMockData(key).slice())

      return
    }

    const _limit = limit || val.limit
    const step = (end - start) / _limit
    let date = start
    let id = 12345
    let fee = 0.1

    const data = Array(_limit).fill(null).map((item, i) => {
      if (_limit === (i + 1)) {
        date = end
      } else if (i > 0) {
        date += step
        id += 1
        fee += 0.1
      }

      const dataItem = _getMockData(key)[0].slice()
      _setDataTo(
        key,
        dataItem,
        {
          date,
          id,
          fee
        }
      )

      return dataItem
    })

    srv.setResponse(key, data.reverse())
  })

  return srv
}

module.exports = {
  createMockRESTv2SrvWithAllData,
  createMockRESTv2SrvWithDate
}
