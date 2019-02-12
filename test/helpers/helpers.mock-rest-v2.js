'use strict'

const { MockRESTv2Server } = require('bfx-api-mock-srv')

const mockData = require('./mock-data')

const _getMockData = (methodName) => {
  if (!mockData.has(methodName)) throw new Error('NO_MOCKING_DATA')

  return mockData.get(methodName)
}

const _fillAllData = (mockRESTv2Srv) => {
  for (let [key, val] of mockData) {
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
    date: Date.now(),
    id: 12345,
    fee: 0.1
  }
) => {
  const _date = Math.round(data.date)

  switch (key) {
    case 'tickers_hist':
      dataItem[15] = _date
      break

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
  start = Date.now(),
  end = start,
  limit = null,
  opts = {
    'tickers_hist': { limit: 250 },
    'wallets_hist': { limit: 100, isNotMoreThanLimit: true },
    'wallets': { limit: 100, isNotMoreThanLimit: true },
    'positions_hist': { limit: 50 },
    'positions_audit': { limit: 250 },
    'ledgers': { limit: 500 },
    'trades': { limit: 1000 },
    'public_trades': { limit: 5000 },
    'orders': { limit: 500 },
    'movements': { limit: 25 },
    'f_offer_hist': { limit: 500 },
    'f_loan_hist': { limit: 500 },
    'f_credit_hist': { limit: 500 },
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

    const _limit = limit && !val.isNotMoreThanLimit ? limit : val.limit
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
