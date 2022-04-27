'use strict'

const { assert } = require('chai')

const splitSymbolPairs = require('../split-symbol-pairs')

describe('splitSymbolPairs helper', () => {
  it('BTC:CNHT pair', function () {
    this.timeout(1000)

    const res = splitSymbolPairs('BTC:CNHT')

    assert.isArray(res)
    assert.lengthOf(res, 2)
    assert.strictEqual(res[0], 'BTC')
    assert.strictEqual(res[1], 'CNHT')
  })

  it('DUSK:USD pair', function () {
    this.timeout(1000)

    const res = splitSymbolPairs('DUSK:USD')

    assert.isArray(res)
    assert.lengthOf(res, 2)
    assert.strictEqual(res[0], 'DUSK')
    assert.strictEqual(res[1], 'USD')
  })

  it('EURUSD pair', function () {
    this.timeout(1000)

    const res = splitSymbolPairs('EURUSD')

    assert.isArray(res)
    assert.lengthOf(res, 2)
    assert.strictEqual(res[0], 'EUR')
    assert.strictEqual(res[1], 'USD')
  })

  it('BTCEOS pair', function () {
    this.timeout(1000)

    const res = splitSymbolPairs('BTCEOS')

    assert.isArray(res)
    assert.lengthOf(res, 2)
    assert.strictEqual(res[0], 'BTC')
    assert.strictEqual(res[1], 'EOS')
  })

  it('tXAUT:USD pair', function () {
    this.timeout(1000)

    const res = splitSymbolPairs('tXAUT:USD')

    assert.isArray(res)
    assert.lengthOf(res, 2)
    assert.strictEqual(res[0], 'XAUT')
    assert.strictEqual(res[1], 'USD')
  })

  it('fBTCUSD pair', function () {
    this.timeout(1000)

    const res = splitSymbolPairs('fBTCUSD')

    assert.isArray(res)
    assert.lengthOf(res, 2)
    assert.strictEqual(res[0], 'BTC')
    assert.strictEqual(res[1], 'USD')
  })

  it('tBTCF0:USD pair', function () {
    this.timeout(1000)

    const res = splitSymbolPairs('tBTCF0:USD')

    assert.isArray(res)
    assert.lengthOf(res, 2)
    assert.strictEqual(res[0], 'BTCF0')
    assert.strictEqual(res[1], 'USD')
  })

  it('tBTCF0USD pair, without separator', function () {
    this.timeout(1000)

    const res = splitSymbolPairs('tBTCF0USD')

    assert.isArray(res)
    assert.lengthOf(res, 2)
    assert.strictEqual(res[0], 'BTCF0')
    assert.strictEqual(res[1], 'USD')
  })

  it('tXAUTUSD pair, without separator', function () {
    this.timeout(1000)

    const res = splitSymbolPairs('tXAUTUSD')

    assert.isArray(res)
    assert.lengthOf(res, 2)
    assert.strictEqual(res[0], 'XAUT')
    assert.strictEqual(res[1], 'USD')
  })

  it('tEUR:USD pair, with separator', function () {
    this.timeout(1000)

    const res = splitSymbolPairs('tEUR:USD')

    assert.isArray(res)
    assert.lengthOf(res, 2)
    assert.strictEqual(res[0], 'EUR')
    assert.strictEqual(res[1], 'USD')
  })

  it('MATIC coin, without separator', function () {
    this.timeout(1000)

    const res = splitSymbolPairs('MATIC')

    assert.isArray(res)
    assert.lengthOf(res, 1)
    assert.strictEqual(res[0], 'MATIC')
  })

  it('tMATIC:USD pair, without separator', function () {
    this.timeout(1000)

    const res = splitSymbolPairs('tMATIC:USD')

    assert.isArray(res)
    assert.lengthOf(res, 2)
    assert.strictEqual(res[0], 'MATIC')
    assert.strictEqual(res[1], 'USD')
  })

  it('MATICM coin, without separator', function () {
    this.timeout(1000)

    const res = splitSymbolPairs('MATICM')

    assert.isArray(res)
    assert.lengthOf(res, 1)
    assert.strictEqual(res[0], 'MATICM')
  })

  it('MATICMF0 coin, without separator', function () {
    this.timeout(1000)

    const res = splitSymbolPairs('MATICMF0')

    assert.isArray(res)
    assert.lengthOf(res, 1)
    assert.strictEqual(res[0], 'MATICMF0')
  })
})
