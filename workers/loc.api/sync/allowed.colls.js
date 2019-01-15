'use strict'

const ALLOWED_COLLS = {
  ALL: '_ALL',
  PUBLIC: '_PUBLIC',
  PRIVATE: '_PRIVATE',
  LEDGERS: 'ledgers',
  TRADES: 'trades',
  PUBLIC_TRADES: 'publicTrades',
  ORDERS: 'orders',
  MOVEMENTS: 'movements',
  FUNDING_OFFER_HISTORY: 'fundingOfferHistory',
  FUNDING_LOAN_HISTORY: 'fundingLoanHistory',
  FUNDING_CREDIT_HISTORY: 'fundingCreditHistory',
  TICKERS_HISTORY: 'tickersHistory',
  POSITIONS_HISTORY: 'positionsHistory',
  SYMBOLS: 'symbols',
  CURRENCIES: 'currencies'
}

const addAllowedColls = (colls = {}) => {
  Object.assign(ALLOWED_COLLS, colls)
}

module.exports = {
  ALLOWED_COLLS,
  addAllowedColls
}
