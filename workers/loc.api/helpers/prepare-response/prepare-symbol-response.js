'use strict'

const {
  omitPrivateModelFields
} = require('./helpers')

const _isInPair = (symbol, pairs) => {
  if (
    !symbol ||
    !Array.isArray(pairs) ||
    pairs.length === 0
  ) {
    return false
  }

  return pairs.some((pair) => {
    const [firstSymb, lastSymb] = _splitPair(pair)

    return (
      firstSymb === symbol ||
      lastSymb === symbol
    )
  })
}

const _splitPair = (pair) => {
  if (
    !pair ||
    typeof pair !== 'string' ||
    pair.length < 6
  ) {
    return [pair]
  }
  if (pair.length === 6) {
    return [pair.slice(0, -3), pair.slice(-3)]
  }
  if (/.+[:].+/.test(pair)) {
    return pair.split(':')
  }

  return [pair]
}

module.exports = (args) => {
  const {
    symbols,
    futures,
    currencies: rawCurrencies,
    inactiveSymbols,
    mapSymbols: rawMapSymbols,
    inactiveCurrencies,
    marginCurrencyList
  } = args ?? {}

  // To cover DB response of the framework mode
  const isMapSymbolsFromDb = (
    Array.isArray(rawMapSymbols) &&
    rawMapSymbols[0]?.key &&
    rawMapSymbols[0]?.value
  )
  const mapSymbols = isMapSymbolsFromDb
    ? rawMapSymbols.map((map) => [map?.key, map?.value])
    : rawMapSymbols
  const pairs = [...symbols, ...futures]
  const currencies = []

  for (const currencie of rawCurrencies) {
    const { id } = currencie ?? {}

    if (
      !id ||
      typeof id !== 'string'
    ) {
      continue
    }

    const _currencie = omitPrivateModelFields(
      currencie,
      { isNotDataFromApiV2: true }
    )

    _currencie.active = inactiveCurrencies.every((ccy) => ccy !== id)
    _currencie.isInPair = _isInPair(id, pairs)
    _currencie.isFunding = marginCurrencyList.some((ccy) => ccy === id)

    currencies.push(_currencie)
  }

  return {
    pairs,
    currencies,
    inactiveSymbols,
    mapSymbols,
    inactiveCurrencies,
    marginCurrencyList
  }
}
