'use strict'

const PARAMS_SCHEMAS_MAP = {
  default: 'paramsSchemaForApi',

  payInvoiceList: 'paramsSchemaForPayInvoiceList',
  statusMessages: 'paramsSchemaForStatusMessagesApi',
  publicTrades: 'paramsSchemaForPublicTrades',
  positionsAudit: 'paramsSchemaForPositionsAudit',
  orderTrades: 'paramsSchemaForOrderTradesApi',
  candles: 'paramsSchemaForCandlesApi'
}

module.exports = (
  method,
  map = PARAMS_SCHEMAS_MAP
) => {
  return map?.[method] ?? map.default
}
