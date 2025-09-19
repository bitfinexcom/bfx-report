'use strict'

module.exports = ({
  apiMethodName,
  symbPropName,
  args
}) => {
  if (
    typeof symbPropName !== 'string' ||
    !args?.params?.symbol ||
    apiMethodName === 'candles' ||
    apiMethodName === 'publicTrades'
  ) {
    return null
  }

  const symbol = args.params.symbol

  if (
    apiMethodName === 'positionsHistory' ||
    apiMethodName === 'positionsAudit'
  ) {
    return Array.isArray(symbol)
      ? [...symbol]
      : [symbol]
  }

  return (
    Array.isArray(symbol) &&
    symbol.length > 1
  )
    ? [...symbol]
    : null
}
