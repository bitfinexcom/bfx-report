'use strict'

const { SCHEMA_IDS } = require('../../../data-validator')

const PARAMS_SCHEMAS_MAP = {
  default: SCHEMA_IDS.COMMON_REQ,

  statusMessages: SCHEMA_IDS.GET_STATUS_MESSAGES_REQ,
  publicTrades: SCHEMA_IDS.GET_PUBLIC_TRADES_REQ,
  positionsAudit: SCHEMA_IDS.GET_POSITIONS_AUDIT_REQ,
  orderTrades: SCHEMA_IDS.GET_ORDER_TRADES_REQ,
  candles: SCHEMA_IDS.GET_CANDLES_REQ,
  ledgers: SCHEMA_IDS.GET_LEDGERS_REQ,
  tickersHistory: SCHEMA_IDS.GET_TICKERS_HISTORY_REQ
}

module.exports = (
  method,
  map = PARAMS_SCHEMAS_MAP
) => {
  return map?.[method] ?? map.default
}
