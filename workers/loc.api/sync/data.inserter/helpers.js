'use strict'

const searchClosePriceAndSumAmount = async (
  dao,
  {
    auth,
    symbol,
    end,
    id
  }
) => {
  const trades = await dao.findInCollBy(
    '_getTrades',
    {
      auth,
      params: {
        symbol,
        end,
        limit: 100
      }
    }
  )

  if (
    !Array.isArray(trades) ||
    trades.length === 0
  ) {
    return {
      closePrice: null,
      sumAmount: null
    }
  }
  if (
    trades.length > 1 &&
    trades[0] &&
    typeof trades[0] === 'object' &&
    trades[1] &&
    typeof trades[1] === 'object' &&
    trades[0].orderID &&
    trades[0].orderID !== trades[1].orderID
  ) {
    const orderID = trades[1].orderID
    const orderIdTrades = trades.filter(trade => (
      trade &&
      typeof trade === 'object' &&
      trade.orderID === orderID
    ))
    const sumAmount = orderIdTrades.reduce((sumAmount, trade) => {
      const _sumAmount = (
        Number.isFinite(sumAmount) &&
        Number.isFinite(trade.execAmount)
      )
        ? sumAmount + trade.execAmount
        : null

      return _sumAmount
    }, 0)

    return {
      closePrice: trades[0].execPrice,
      sumAmount
    }
  }

  const _ledgers = await dao.findInCollBy(
    '_getLedgers',
    {
      auth,
      params: { end }
    }
  )
  const ledgers = Array.isArray(_ledgers) ? _ledgers : []

  const regexp = new RegExp(`#${id}.*settlement`, 'gi')
  const closedPosition = ledgers.find(ledger => (
    ledger &&
    typeof ledger === 'object' &&
    regexp.test(ledger.description)
  ))

  const closePrice = (
    closedPosition &&
    typeof closedPosition === 'object' &&
    closedPosition.description &&
    typeof closedPosition.description === 'string'
  )
    ? closedPosition.description
    : null

  return {
    closePrice,
    sumAmount: null
  }
}

module.exports = {
  searchClosePriceAndSumAmount
}
