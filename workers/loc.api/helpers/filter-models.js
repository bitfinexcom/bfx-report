'use strict'

const FILTER_MODELS_NAMES = require('./filter.models.names')

// TODO:
module.exports = new Map([
  [
    FILTER_MODELS_NAMES.TICKERS_HISTORY,
    {
      id: { type: 'integer' }
    }
  ],
  [
    FILTER_MODELS_NAMES.POSITIONS_HISTORY,
    {
      id: { type: 'integer' }
    }
  ],
  [
    FILTER_MODELS_NAMES.LEDGERS,
    {
      id: { type: 'integer' }
    }
  ],
  [
    FILTER_MODELS_NAMES.TRADES,
    {
      id: { type: 'integer' }
    }
  ],
  [
    FILTER_MODELS_NAMES.FUNDING_TRADES,
    {
      id: { type: 'integer' }
    }
  ],
  [
    FILTER_MODELS_NAMES.PUBLIC_TRADES,
    {
      id: { type: 'integer' }
    }
  ],
  [
    FILTER_MODELS_NAMES.ORDERS,
    {
      id: { type: 'integer' }
    }
  ],
  [
    FILTER_MODELS_NAMES.MOVEMENTS,
    {
      id: { type: 'integer' }
    }
  ],
  [
    FILTER_MODELS_NAMES.FUNDING_OFFER_HISTORY,
    {
      id: { type: 'integer' }
    }
  ],
  [
    FILTER_MODELS_NAMES.FUNDING_LOAN_HISTORY,
    {
      id: { type: 'integer' }
    }
  ],
  [
    FILTER_MODELS_NAMES.FUNDING_CREDIT_HISTORY,
    {
      id: { type: 'integer' }
    }
  ]
])
