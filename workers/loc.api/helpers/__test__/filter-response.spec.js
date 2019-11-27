'use strict'

const { assert } = require('chai')

const filterResponse = require('../filter-response')
const mockData = [
  {
    id: 2324639934,
    currency: 'ETH',
    mts: 1559251505000,
    amount: 0.1,
    balance: 10.20,
    description: 'Settlement @ 1.123 on wallet margin',
    wallet: 'margin'
  },
  {
    id: 2324639935,
    currency: 'BTC',
    mts: 1559251505000,
    amount: 1.1,
    balance: 20.20,
    description: 'Trading fees for 0.17 BTC (BTCUSD) @ 8205.0 on BFX...',
    wallet: 'exchange'
  },
  {
    id: 2324639936,
    currency: 'USD',
    mts: 1559251505000,
    amount: 2.1,
    balance: 30.20,
    description: 'Wire Withdrawal #13002753 on wallet funding',
    wallet: 'funding'
  },
  {
    id: 2324639937,
    currency: 'EUR',
    mts: 1559251505000,
    amount: 3.1,
    balance: 40.20,
    description: 'Position closed @ 1.0947% (TRADE) on wallet margin',
    wallet: 'margin'
  },
  {
    id: 2324639938,
    currency: 'JPU',
    mts: 1559251505000,
    amount: 4.1,
    balance: 50.20,
    description: 'Exchange 657.55328064 XRP for USD @ 0.26968 on wallet_exchange',
    wallet: 'exchange'
  },
  {
    id: 2324639939,
    currency: 'LEO',
    mts: 1559251505000,
    amount: 5.1,
    balance: 60.20,
    description: 'Trading fees for 0.17 BTC (BTCUSD) @ 8205.0 on BFX...',
    wallet: 'funding'
  },
  {
    id: 2324639940,
    currency: 'LEO',
    mts: 1559251505000,
    amount: null,
    balance: 60.30,
    description: 'Trading fees for 0.17 BTC (BTCUSD) @ 8205.0 on BFX...',
    wallet: 'funding'
  },
  {
    id: 2324639941,
    currency: 'LEO',
    mts: 1559251505000,
    amount: 5.2,
    balance: undefined,
    description: 'Trading fees for 0.17 BTC (BTCUSD) @ 8205.0 on BFX...',
    wallet: 'funding'
  },
  {
    id: 2324639942,
    currency: 'LEO',
    mts: 1559251505000,
    amount: null,
    balance: undefined,
    description: 'Trading fees for 0.17 BTC (BTCUSD) @ 8205.0 on BFX...',
    wallet: 'funding'
  }
]

const _isNull = (val) => {
  return (
    val === null ||
    typeof val === 'undefined'
  )
}

describe('filterResponse helper', () => {
  it('it should be successful with $gt condition', function () {
    this.timeout(1000)

    const res = filterResponse(
      mockData,
      { $gt: { amount: 3.0 } }
    )

    assert.isAbove(res.length, 0)

    res.forEach(({ amount }) => {
      assert.isNumber(amount)
      assert.isAbove(amount, 3.0)
    })
  })

  it('it should be successful with $gte condition', function () {
    this.timeout(1000)

    const res = filterResponse(
      mockData,
      { $gte: { amount: 3.1 } }
    )

    assert.isAbove(res.length, 0)

    res.forEach(({ amount }) => {
      assert.isNumber(amount)
      assert.isAtLeast(amount, 3.1)
    })
  })

  it('it should be successful with $lt condition', function () {
    this.timeout(1000)

    const res = filterResponse(
      mockData,
      { $lt: { amount: 3.0 } }
    )

    assert.isAbove(res.length, 0)

    res.forEach(({ amount }) => {
      assert.isNumber(amount)
      assert.isBelow(amount, 3.0)
    })
  })

  it('it should be successful with $lte condition', function () {
    this.timeout(1000)

    const res = filterResponse(
      mockData,
      { $lte: { amount: 3.1 } }
    )

    assert.isAbove(res.length, 0)

    res.forEach(({ amount }) => {
      assert.isNumber(amount)
      assert.isAtMost(amount, 3.1)
    })
  })

  it('it should be successful with $not condition', function () {
    this.timeout(1000)

    const res = filterResponse(
      mockData,
      { $not: { wallet: 'margin' } }
    )

    assert.isAbove(res.length, 0)

    res.forEach(({ wallet }) => {
      assert.isString(wallet)
      assert.notStrictEqual(wallet, 'margin')
    })
  })

  it('it should be successful with $like condition using <%>', function () {
    this.timeout(1000)

    const res = filterResponse(
      mockData,
      { $like: { description: 'Position%' } }
    )

    assert.isAbove(res.length, 0)

    res.forEach(({ description }) => {
      assert.isString(description)
      assert.match(description, /^Position/)
    })
  })

  it('it should be successful with $like condition, not consider capital letters', function () {
    this.timeout(1000)

    const resArr = [
      filterResponse(
        mockData,
        { $like: { description: 'settlement%' } }
      ),
      filterResponse(
        mockData,
        { $like: { description: 'SETTLEMENT%' } }
      ),
      filterResponse(
        mockData,
        { $like: { description: 'settleMent%' } }
      )
    ]

    resArr.forEach((res) => {
      assert.isAbove(res.length, 0)

      res.forEach(({ description }) => {
        assert.isString(description)
        assert.match(description, /^settlement/i)
      })
    })
  })

  it('it should be successful with $like condition using escaping <%>', function () {
    this.timeout(1000)

    const res = filterResponse(
      mockData,
      { $like: { description: '%@ 1.0947\\%%' } }
    )

    assert.isAbove(res.length, 0)

    res.forEach(({ description }) => {
      assert.isString(description)
      assert.match(description, /@ 1.0947%/)
    })
  })

  it('it should be successful with $like condition using <_>', function () {
    this.timeout(1000)

    const res = filterResponse(
      mockData,
      { $like: { description: 'Settle_ent%' } }
    )

    assert.isAbove(res.length, 0)

    res.forEach(({ description }) => {
      assert.isString(description)
      assert.match(description, /^Settlement @ 1.123/)
    })
  })

  it('it should be successful with $like condition using escaping <_>', function () {
    this.timeout(1000)

    const res = filterResponse(
      mockData,
      { $like: { description: '%wallet\\_exchange' } }
    )

    assert.isAbove(res.length, 0)

    res.forEach(({ description }) => {
      assert.isString(description)
      assert.match(description, /wallet_exchange$/)
    })
  })

  it('it should be successful with $eq condition', function () {
    this.timeout(1000)

    const res = filterResponse(
      mockData,
      { $eq: { amount: 3.1 } }
    )

    assert.isAbove(res.length, 0)

    res.forEach(({ amount }) => {
      assert.isNumber(amount)
      assert.strictEqual(amount, 3.1)
    })
  })

  it('it should be successful with $ne condition', function () {
    this.timeout(1000)

    const res = filterResponse(
      mockData,
      { $ne: { amount: 3.1 } }
    )

    assert.isAbove(res.length, 0)

    res.forEach(({ amount }) => {
      assert.isNumber(amount)
      assert.notStrictEqual(amount, 3.1)
    })
  })

  it('it should be successful with $in condition', function () {
    this.timeout(1000)

    const walletArr = ['funding', 'margin']

    const res = filterResponse(
      mockData,
      { $in: { wallet: walletArr } }
    )

    assert.isAbove(res.length, 0)

    res.forEach(({ wallet }) => {
      assert.isString(wallet)
      assert.include(walletArr, wallet)
    })
  })

  it('it should be successful with $nin condition', function () {
    this.timeout(1000)

    const walletArr = ['funding', 'margin']

    const res = filterResponse(
      mockData,
      { $nin: { wallet: walletArr } }
    )

    assert.isAbove(res.length, 0)

    res.forEach(({ wallet }) => {
      assert.isString(wallet)
      assert.notInclude(walletArr, wallet)
    })
  })

  it('it should be successful with $gt and $like and $nin conditions', function () {
    this.timeout(1000)

    const walletArr = ['funding', 'margin']
    const currenciesArr = ['ETH', 'USD']

    const res = filterResponse(
      mockData,
      {
        $gt: { amount: 2.0 },
        $like: { description: 'Exchange_657.55328064%' },
        $nin: { wallet: walletArr, currency: currenciesArr }
      }
    )

    assert.isAbove(res.length, 0)

    res.forEach(({
      amount,
      description,
      wallet,
      currency
    }) => {
      assert.isNumber(amount)
      assert.isString(description)
      assert.isString(wallet)
      assert.isString(currency)
      assert.isAbove(amount, 2.0)
      assert.match(description, /^Exchange 657.55328064/)
      assert.notInclude(walletArr, wallet)
      assert.notInclude(currenciesArr, currency)
    })
  })

  it('it should be successful with $or operator', function () {
    this.timeout(1000)

    const res = filterResponse(
      mockData,
      {
        $or: {
          $lt: { amount: 2.0 },
          $gt: { amount: 4.0 }
        }
      }
    )

    assert.isAbove(res.length, 0)

    res.forEach(({ amount }) => {
      assert.isNumber(amount)
      assert.isOk(
        amount < 2.0 ||
        amount > 4.0
      )
    })
  })

  it('it should be successful with $isNull operator', function () {
    this.timeout(1000)

    const resWithOneElem = filterResponse(
      mockData,
      {
        $isNull: ['amount', 'balance']
      }
    )

    assert.equal(resWithOneElem.length, 1)

    resWithOneElem.forEach(({ amount, balance }) => {
      assert.isOk(
        _isNull(amount) &&
        _isNull(balance)
      )
    })

    const resWithTwoElem = filterResponse(
      mockData,
      {
        $isNull: ['amount']
      }
    )

    assert.equal(resWithTwoElem.length, 2)

    resWithTwoElem.forEach(({ amount }) => {
      assert.isOk(_isNull(amount))
    })
  })

  it('it should be successful with $isNotNull operator', function () {
    this.timeout(1000)

    const res = filterResponse(
      mockData,
      {
        $isNotNull: ['amount', 'balance']
      }
    )

    assert.isAbove(res.length, 0)

    res.forEach(({ amount, balance }) => {
      assert.isNumber(amount)
      assert.isNumber(balance)
    })
  })
})
