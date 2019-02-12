'use strict'

const searchClosePrice = async (
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
        end
      }
    }
  )

  if (
    !Array.isArray(trades) ||
    trades.length === 0
  ) {
    return null
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
    return trades[0].execPrice
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

  return (
    closedPosition &&
    typeof closedPosition === 'object' &&
    closedPosition.description &&
    typeof closedPosition.description === 'string'
  )
    ? closedPosition.description
    : null
}

module.exports = {
  searchClosePrice
}
