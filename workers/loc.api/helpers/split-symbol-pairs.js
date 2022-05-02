'use strict'

const FOREX_SYMBS = require('./forex.symbs')

const detectingSymbs = [
  'BTC',
  ...FOREX_SYMBS
]

/* It allows to cover pairs with str length 6 and without `t` and `f` prefixes
 * for currency converter of bfx-reports-framework used to triangulation:
 * `BTCUSD`, `BTCEOS` etc
 */
const isNotSymbContained = (
  currSymb,
  symbs = detectingSymbs
) => {
  return (
    Array.isArray(symbs) &&
    symbs.every((symb) => (
      !currSymb.startsWith(symb) &&
      !currSymb.endsWith(symb)
    ))
  )
}

const _startsWithPrefix = (str) => (
  str.startsWith('t') ||
  str.startsWith('f')
)

const _containsSeparator = (str) => (
  /.+[:].+/.test(str)
)

module.exports = (symbol) => {
  const hasPrefix = _startsWithPrefix(symbol)
  const hasSeparator = _containsSeparator(symbol)

  if (
    !hasPrefix &&
    !hasSeparator &&
    symbol.length > 5 &&
    isNotSymbContained(symbol)
  ) {
    return [symbol]
  }

  const str = hasPrefix
    ? symbol.slice(1)
    : symbol

  if (
    str.length > 5 &&
    hasSeparator
  ) {
    return str.split(':')
  }
  if (str.length < 6) {
    return [str]
  }

  return [str.slice(0, -3), str.slice(-3)]
}
