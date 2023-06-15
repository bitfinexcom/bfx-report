'use strict'

const BFX_API_METHOD_NAME_MAP = {
  trades: 'accountTrades',
  publicTrades: 'trades',
  orders: 'orderHistory'
}

module.exports = (
  methodName,
  map = BFX_API_METHOD_NAME_MAP
) => {
  return map?.[methodName] ?? methodName
}
