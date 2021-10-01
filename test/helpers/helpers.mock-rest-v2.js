'use strict'

const { v4: uuidv4 } = require('uuid')
const { MockRESTv2Server } = require('bfx-api-mock-srv')

const _mockData = require('./mock-data')

const getMockData = (methodName, mockData = _mockData) => {
  if (!mockData.has(methodName)) throw new Error('NO_MOCKING_DATA')

  return mockData.get(methodName)
}

const _fillAllData = (mockRESTv2Srv) => {
  for (const [key, val] of _mockData) {
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

const setDataTo = (
  key,
  dataItem,
  params = {}
) => {
  const {
    date = Date.now(),
    id = 12345,
    fee = -0.0001,
    strId = uuidv4()
  } = { ...params }

  const _date = Math.round(date)

  switch (key) {
    case 'invoice_list':
      dataItem.id = strId
      dataItem.t = _date
      break

    case 'candles':
      dataItem[0] = _date
      break

    case 'change_log':
      dataItem[0] = _date
      break

    case 'logins_hist':
      dataItem[0] = id
      dataItem[2] = _date
      break

    case 'status_messages':
      dataItem[1] = _date
      dataItem[8] = _date
      break

    case 'tickers_hist':
      dataItem[15] = _date
      break

    case 'positions_snap':
      dataItem[11] = id
      dataItem[12] = _date
      dataItem[13] = _date
      break

    case 'positions_hist':
      dataItem[11] = id
      dataItem[12] = _date
      dataItem[13] = _date
      break

    case 'positions':
      dataItem[11] = id
      dataItem[12] = _date
      dataItem[13] = _date
      break

    case 'positions_audit':
      dataItem[11] = id
      dataItem[12] = _date
      dataItem[13] = _date
      break

    case 'ledgers':
      dataItem[0] = id
      dataItem[3] = _date
      break

    case 'trades':
      dataItem[0] = id
      dataItem[2] = _date
      dataItem[3] = id
      dataItem[9] = fee
      break

    case 'f_trade_hist':
      dataItem[0] = id
      dataItem[2] = _date
      dataItem[3] = id
      break

    case 'public_trades':
      dataItem[0] = id
      dataItem[1] = _date
      break

    case 'order_trades':
      dataItem[0] = id
      dataItem[2] = _date
      dataItem[3] = id
      dataItem[9] = fee
      break

    case 'orders':
      dataItem[0] = id
      dataItem[4] = _date
      dataItem[5] = _date
      break

    case 'active_orders':
      dataItem[0] = id
      dataItem[4] = _date
      dataItem[5] = _date
      break

    case 'movements':
      dataItem[0] = id
      dataItem[5] = _date
      dataItem[6] = _date
      break

    case 'f_offer_hist':
      dataItem[0] = id
      dataItem[2] = _date
      dataItem[3] = _date
      break

    case 'f_loan_hist':
      dataItem[0] = id
      dataItem[3] = _date
      dataItem[4] = _date
      break

    case 'f_credit_hist':
      dataItem[0] = id
      dataItem[3] = _date
      dataItem[4] = _date
      break
  }

  return dataItem
}

const getMockDataOpts = () => ({
  tickers_hist: { limit: 250 },
  wallets: { limit: 100, isNotMoreThanLimit: true },
  positions_hist: { limit: 50 },
  positions_snap: { limit: 50 },
  positions: { limit: 50 },
  positions_audit: { limit: 250 },
  ledgers: { limit: 500 },
  trades: { limit: 1000 },
  f_trade_hist: { limit: 1000 },
  public_trades: { limit: 5000 },
  status_messages: { limit: 10, isNotMoreThanLimit: true },
  order_trades: { limit: 1000 },
  orders: { limit: 500 },
  active_orders: { limit: 100 },
  movements: { limit: 25 },
  f_offer_hist: { limit: 500 },
  f_loan_hist: { limit: 500 },
  f_credit_hist: { limit: 500 },
  logins_hist: { limit: 250 },
  change_log: { limit: 500 },
  candles: { limit: 500 },
  invoice_list: { limit: 100 },
  user_info: null,
  symbols: null,
  map_symbols: null,
  inactive_currencies: null,
  inactive_symbols: null,
  futures: null,
  currencies: null,
  account_summary: null,
  get_settings: null,
  set_settings: null,
  generate_token: null
})

const createMockRESTv2SrvWithDate = (
  start = Date.now(),
  end = start,
  limit = null,
  opts = getMockDataOpts(),
  {
    _getMockData = getMockData,
    _setDataTo = setDataTo
  } = {}
) => {
  const srv = _createMockRESTv2Srv()

  Object.entries(opts).forEach(([key, val]) => {
    const mockData = _getMockData(key)

    if (
      val === null ||
      !mockData[0] ||
      (
        !Array.isArray(mockData[0]) &&
        typeof mockData[0] !== 'object'
      )
    ) {
      srv.setResponse(key, [...mockData])

      return
    }

    const _limit = limit && !val.isNotMoreThanLimit ? limit : val.limit
    const step = (end - start) / _limit
    let date = start
    let id = 12345
    let fee = 0.1
    let strId = uuidv4()

    const data = Array(_limit).fill(null).map((item, i) => {
      if (_limit === (i + mockData.length)) {
        date = end
      } else if (
        i + 1 > mockData.length &&
        i % mockData.length === 0
      ) {
        date += step
      }
      if (i > 0) {
        id += 1
        fee -= 0.0001
        strId = uuidv4()
      }

      const mockDataItem = mockData[i % mockData.length]
      const dataItem = Array.isArray(mockDataItem)
        ? [...mockDataItem]
        : { ...mockDataItem }

      _setDataTo(
        key,
        dataItem,
        {
          date,
          id,
          fee,
          strId
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
  createMockRESTv2SrvWithDate,
  getMockDataOpts,
  getMockData,
  setDataTo
}
