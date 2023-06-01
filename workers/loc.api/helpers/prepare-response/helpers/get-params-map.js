'use strict'

const MAIN_PARAMS_MAP = {
  start: 'start',
  end: 'end',
  limit: 'limit'
}
const DEFAULT_PARAMS_MAP = {
  ...MAIN_PARAMS_MAP,
  symbol: 'symbol'
}

const PARAMS_MAP = {
  default: DEFAULT_PARAMS_MAP,

  candles: {
    timeframe: 'timeframe',
    symbol: 'symbol',
    section: 'section',
    sort: 'query.sort',
    start: 'query.start',
    end: 'query.end',
    limit: 'query.limit'
  },
  ledgers: {
    ...MAIN_PARAMS_MAP,
    symbol: 'filters.ccy',
    category: 'filters.category'
  },
  statusMessages: {
    type: 'type',
    symbol: 'keys'
  },
  positionsAudit: {
    ...MAIN_PARAMS_MAP,
    id: 'id'
  },
  orderTrades: {
    ...MAIN_PARAMS_MAP,
    id: 'orderId'
  },
  tickersHistory: {
    ...MAIN_PARAMS_MAP,
    symbol: 'symbols'
  },
  payInvoiceList: {
    ...MAIN_PARAMS_MAP,
    id: 'id'
  },
  trades: {
    ...DEFAULT_PARAMS_MAP,
    sort: 'sort'
  },
  accountTrades: {
    ...DEFAULT_PARAMS_MAP,
    sort: 'sort'
  },
  movements: {
    ...MAIN_PARAMS_MAP,
    symbol: 'ccy',
    address: 'address',
    id: 'id'
  }
}

module.exports = (
  method,
  map = PARAMS_MAP
) => {
  return map?.[method] ?? map.default
}
