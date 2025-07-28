'use strict'

const FILTER_SCHEMA_IDS = require('../../filter.schema.ids')

module.exports = new Map([
  [
    FILTER_SCHEMA_IDS.GET_POSITIONS_HISTORY_REQ_FILTER,
    {
      id: { type: 'integer' },
      symbol: { type: 'string' },
      status: { type: 'string' },
      amount: { type: 'number' },
      basePrice: { type: 'number' },
      closePrice: { type: 'number' },
      marginFunding: { type: 'number' },
      marginFundingType: { type: 'integer' },
      pl: { type: 'number' },
      plPerc: { type: 'number' },
      liquidationPrice: { type: 'number' },
      leverage: { type: 'number' },
      placeholder: { type: 'string' },
      mtsCreate: { type: 'integer' },
      mtsUpdate: { type: 'integer' }
    }
  ],
  [
    FILTER_SCHEMA_IDS.GET_TRADES_REQ_FILTER,
    {
      id: { type: 'integer' },
      symbol: { type: 'string' },
      mtsCreate: { type: 'integer' },
      orderID: { type: 'integer' },
      execAmount: { type: 'number' },
      execPrice: { type: 'number' },
      orderType: { type: 'string' },
      orderPrice: { type: 'number' },
      maker: { type: 'integer' },
      fee: { type: 'number' },
      feeCurrency: { type: 'string' }
    }
  ],
  [
    FILTER_SCHEMA_IDS.GET_LEDGERS_REQ_FILTER,
    {
      id: { type: 'integer' },
      currency: { type: 'string' },
      mts: { type: 'integer' },
      amount: { type: 'number' },
      amountUsd: { type: 'number' },
      balance: { type: 'number' },
      balanceUsd: { type: 'number' },
      description: { type: 'string' },
      wallet: { type: 'string' }
    }
  ],
  [
    FILTER_SCHEMA_IDS.GET_TICKERS_HISTORY_REQ_FILTER,
    {
      symbol: { type: 'string' },
      bid: { type: 'number' },
      bidPeriod: { type: 'integer' },
      ask: { type: 'number' },
      mtsUpdate: { type: 'integer' }
    }
  ],
  [
    FILTER_SCHEMA_IDS.GET_FUNDING_TRADES_REQ_FILTER,
    {
      id: { type: 'integer' },
      symbol: { type: 'string' },
      mtsCreate: { type: 'integer' },
      offerID: { type: 'integer' },
      amount: { type: 'number' },
      rate: { type: 'number' },
      period: { type: 'integer' },
      maker: { type: 'integer' }
    }
  ]
])
