'use strict'

const { searchClosePriceAndSumAmount } = require('./halpers')

class ApiMiddlewareHandlerAfter {
  constructor (reportService, dao) {
    this.reportService = reportService
    this.dao = dao
  }

  async _getPositionsHistory ({ auth }, apiRes, isCheckCall) {
    if (isCheckCall) {
      return apiRes
    }

    const res = []

    for (const position of apiRes.res) {
      const {
        basePrice,
        symbol,
        mtsUpdate: end,
        id
      } = position

      if (
        !symbol ||
        typeof symbol !== 'string' ||
        /tBFX/gi.test(symbol) ||
        !Number.isInteger(end) ||
        !Number.isInteger(id) ||
        !Number.isFinite(basePrice)
      ) {
        res.push({
          ...position,
          closePrice: null
        })

        continue
      }

      const {
        closePrice,
        sumAmount
      } = await searchClosePriceAndSumAmount(
        this.dao,
        {
          auth,
          symbol,
          end,
          id
        }
      )

      if (
        !Number.isFinite(closePrice) ||
        !Number.isFinite(sumAmount)
      ) {
        res.push({
          ...position,
          closePrice,
          pl: null,
          plPerc: null
        })

        continue
      }

      const pl = (closePrice - basePrice) * sumAmount
      const plPerc = ((closePrice / basePrice) - 1) * 100

      res.push({
        ...position,
        closePrice,
        pl,
        plPerc
      })
    }

    return {
      ...apiRes,
      res
    }
  }

  _getPublicTrades (args, apiRes) {
    if (args.params.symbol) {
      const res = apiRes.res.map(item => ({
        ...item,
        _symbol: args.params.symbol
      }))

      return {
        ...apiRes,
        res
      }
    }

    return apiRes
  }

  _getLedgers (args, apiRes) {
    const res = apiRes.res.map(item => ({
      ...item,
      _isMarginFundingPayment: /Margin Funding Payment/gi.test(
        item.description
      )
    }))

    return {
      ...apiRes,
      res
    }
  }
}

module.exports = ApiMiddlewareHandlerAfter
