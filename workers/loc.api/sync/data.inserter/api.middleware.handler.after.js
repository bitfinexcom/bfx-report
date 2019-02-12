'use strict'

class ApiMiddlewareHandlerAfter {
  constructor (reportService, dao) {
    this.reportService = reportService
    this.dao = dao
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
