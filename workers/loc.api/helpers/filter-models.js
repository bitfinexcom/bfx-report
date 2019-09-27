'use strict'

const FILTER_MODELS_NAMES = require('./filter.models.names')

module.exports = new Map([
  [
    FILTER_MODELS_NAMES.TICKERS_HISTORY,
    {
      symbol: { type: 'string' },
      bid: { type: 'number' },
      bidPeriod: { type: 'integer' },
      ask: { type: 'number' },
      mtsUpdate: { type: 'integer' }
    }
  ],
  [
    FILTER_MODELS_NAMES.POSITIONS_HISTORY,
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
    FILTER_MODELS_NAMES.LEDGERS,
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
    FILTER_MODELS_NAMES.TRADES,
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
    FILTER_MODELS_NAMES.FUNDING_TRADES,
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
  ],
  [
    FILTER_MODELS_NAMES.PUBLIC_TRADES,
    {
      id: { type: 'integer' },
      mts: { type: 'integer' },
      rate: { type: 'number' },
      period: { type: 'integer' },
      amount: { type: 'number' },
      price: { type: 'number' }
    }
  ],
  [
    FILTER_MODELS_NAMES.ORDERS,
    {
      id: { type: 'integer' },
      gid: { type: 'integer' },
      cid: { type: 'integer' },
      symbol: { type: 'string' },
      mtsCreate: { type: 'integer' },
      mtsUpdate: { type: 'integer' },
      amount: { type: 'number' },
      amountOrig: { type: 'number' },
      type: { type: 'string' },
      typePrev: { type: 'string' },
      flags: { type: 'integer' },
      status: { type: 'string' },
      price: { type: 'number' },
      priceAvg: { type: 'number' },
      priceTrailing: { type: 'number' },
      priceAuxLimit: { type: 'number' },
      notify: { type: 'integer' },
      placedId: { type: 'integer' },
      amountExecuted: { type: 'number' }
    }
  ],
  [
    FILTER_MODELS_NAMES.MOVEMENTS,
    {
      id: { type: 'integer' },
      currency: { type: 'string' },
      currencyName: { type: 'string' },
      mtsStarted: { type: 'integer' },
      mtsUpdated: { type: 'integer' },
      status: { type: 'string' },
      amount: { type: 'number' },
      amountUsd: { type: 'number' },
      fees: { type: 'number' },
      destinationAddress: { type: 'string' },
      transactionId: { type: 'string' }
    }
  ],
  [
    FILTER_MODELS_NAMES.FUNDING_OFFER_HISTORY,
    {
      id: { type: 'integer' },
      symbol: { type: 'string' },
      mtsCreate: { type: 'integer' },
      mtsUpdate: { type: 'integer' },
      amount: { type: 'number' },
      amountOrig: { type: 'number' },
      type: { type: 'string' },
      flags: { type: 'string' },
      status: { type: 'string' },
      rate: { type: 'string' },
      period: { type: 'integer' },
      notify: { type: 'integer' },
      hidden: { type: 'integer' },
      renew: { type: 'integer' },
      rateReal: { type: 'integer' },
      amountExecuted: { type: 'number' }
    }
  ],
  [
    FILTER_MODELS_NAMES.FUNDING_LOAN_HISTORY,
    {
      id: { type: 'integer' },
      symbol: { type: 'string' },
      side: { type: 'integer' },
      mtsCreate: { type: 'integer' },
      mtsUpdate: { type: 'integer' },
      amount: { type: 'number' },
      flags: { type: 'string' },
      status: { type: 'string' },
      rate: { type: 'string' },
      period: { type: 'integer' },
      mtsOpening: { type: 'integer' },
      mtsLastPayout: { type: 'integer' },
      notify: { type: 'integer' },
      hidden: { type: 'integer' },
      renew: { type: 'integer' },
      rateReal: { type: 'integer' },
      noClose: { type: 'integer' }
    }
  ],
  [
    FILTER_MODELS_NAMES.FUNDING_CREDIT_HISTORY,
    {
      id: { type: 'integer' },
      symbol: { type: 'string' },
      side: { type: 'integer' },
      mtsCreate: { type: 'integer' },
      mtsUpdate: { type: 'integer' },
      amount: { type: 'number' },
      flags: { type: 'string' },
      status: { type: 'string' },
      rate: { type: 'string' },
      period: { type: 'integer' },
      mtsOpening: { type: 'integer' },
      mtsLastPayout: { type: 'integer' },
      notify: { type: 'integer' },
      hidden: { type: 'integer' },
      renew: { type: 'integer' },
      rateReal: { type: 'integer' },
      noClose: { type: 'integer' },
      positionPair: { type: 'string' }
    }
  ]
])
