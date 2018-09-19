'use strict'

const _models = new Map([
  [
    'users',
    {
      _id: '',
      email: '',
      apiKey: '',
      apiSecret: '',
      active: ''
    }
  ],
  [
    'ledgers',
    {
      _id: '',
      id: '',
      currency: '',
      mts: '',
      amount: '',
      balance: '',
      description: '',
      user_id: ''
    }
  ],
  [
    'trades',
    {
      _id: '',
      id: '',
      symbol: '',
      mtsCreate: '',
      orderID: '',
      execAmount: '',
      execPrice: '',
      orderType: '',
      orderPrice: '',
      maker: '',
      fee: '',
      feeCurrency: '',
      user_id: ''
    }
  ],
  [
    'orders',
    {
      _id: '',
      id: '',
      gid: '',
      cid: '',
      symbol: '',
      mtsCreate: '',
      mtsUpdate: '',
      amount: '',
      amountOrig: '',
      type: '',
      typePrev: '',
      flags: '',
      status: '',
      price: '',
      priceAvg: '',
      priceTrailing: '',
      priceAuxLimit: '',
      notify: '',
      placedId: '',
      _lastAmount: '',
      user_id: ''
    }
  ],
  [
    'movements',
    {
      _id: '',
      id: '',
      currency: '',
      currencyName: '',
      mtsStarted: '',
      mtsUpdated: '',
      status: '',
      amount: '',
      fees: '',
      destinationAddress: '',
      transactionId: '',
      user_id: ''
    }
  ],
  [
    'fundingOfferHistory',
    {
      _id: '',
      id: '',
      symbol: '',
      mtsCreate: '',
      mtsUpdate: '',
      amount: '',
      amountOrig: '',
      type: '',
      flags: '',
      status: '',
      rate: '',
      period: '',
      notify: '',
      hidden: '',
      renew: '',
      rateReal: '',
      user_id: ''
    }
  ],
  [
    'fundingLoanHistory',
    {
      _id: '',
      id: '',
      symbol: '',
      side: '',
      mtsCreate: '',
      mtsUpdate: '',
      amount: '',
      flags: '',
      status: '',
      rate: '',
      period: '',
      mtsOpening: '',
      mtsLastPayout: '',
      notify: '',
      hidden: '',
      renew: '',
      rateReal: '',
      noClose: '',
      user_id: ''
    }
  ],
  [
    'fundingCreditHistory',
    {
      _id: '',
      id: '',
      symbol: '',
      side: '',
      mtsCreate: '',
      mtsUpdate: '',
      amount: '',
      flags: '',
      status: '',
      rate: '',
      period: '',
      mtsOpening: '',
      mtsLastPayout: '',
      notify: '',
      hidden: '',
      renew: '',
      rateReal: '',
      noClose: '',
      positionPair: '',
      user_id: ''
    }
  ],
  [
    'symbols',
    {
      _id: '',
      pairs: ''
    }
  ],
  [
    'scheduler',
    {
      _id: '',
      isEnable: ''
    }
  ],
  [
    'syncMode',
    {
      _id: '',
      isEnable: ''
    }
  ]
])

const _methodCollMap = new Map([
  [
    '_getLedgers',
    {
      name: 'ledgers',
      maxLimit: 5000,
      dateFieldName: 'mts',
      symbolFieldName: 'currency',
      hasNewData: false,
      start: 0,
      type: 'array:object',
      model: { ..._models.get('ledgers') }
    }
  ],
  [
    '_getTrades',
    {
      name: 'trades',
      maxLimit: 1500,
      dateFieldName: 'mtsCreate',
      symbolFieldName: 'symbol',
      hasNewData: false,
      start: 0,
      type: 'array:object',
      model: { ..._models.get('trades') }
    }
  ],
  [
    '_getOrders',
    {
      name: 'orders',
      maxLimit: 5000,
      dateFieldName: 'mtsUpdate',
      symbolFieldName: 'symbol',
      hasNewData: false,
      start: 0,
      type: 'array:object',
      model: { ..._models.get('orders') }
    }
  ],
  [
    '_getMovements',
    {
      name: 'movements',
      maxLimit: 25,
      dateFieldName: 'mtsUpdated',
      symbolFieldName: 'currency',
      hasNewData: false,
      start: 0,
      type: 'array:object',
      model: { ..._models.get('movements') }
    }
  ],
  [
    '_getFundingOfferHistory',
    {
      name: 'fundingOfferHistory',
      maxLimit: 5000,
      dateFieldName: 'mtsUpdate',
      symbolFieldName: 'symbol',
      hasNewData: false,
      start: 0,
      type: 'array:object',
      model: { ..._models.get('fundingOfferHistory') }
    }
  ],
  [
    '_getFundingLoanHistory',
    {
      name: 'fundingLoanHistory',
      maxLimit: 5000,
      dateFieldName: 'mtsUpdate',
      symbolFieldName: 'symbol',
      hasNewData: false,
      start: 0,
      type: 'array:object',
      model: { ..._models.get('fundingLoanHistory') }
    }
  ],
  [
    '_getFundingCreditHistory',
    {
      name: 'fundingCreditHistory',
      maxLimit: 5000,
      dateFieldName: 'mtsUpdate',
      symbolFieldName: 'symbol',
      hasNewData: false,
      start: 0,
      type: 'array:object',
      model: { ..._models.get('fundingCreditHistory') }
    }
  ],
  [
    '_getSymbols',
    {
      name: 'symbols',
      maxLimit: 5000,
      field: 'pairs',
      sotr: [['pairs', 1]],
      hasNewData: false,
      type: 'array',
      model: { ..._models.get('symbols') }
    }
  ]
])

const getMethodCollMap = () => {
  return new Map(_methodCollMap)
}

const getModelsMap = () => {
  return new Map(_models)
}

module.exports = {
  getMethodCollMap,
  getModelsMap
}
