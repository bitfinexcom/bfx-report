'use strict'

const {
  MaxWeightedAveragesReportTradesNumError
} = require('../errors')

const { decorateInjectable } = require('../di/utils')

const depsTypes = (TYPES) => [
  TYPES.RService,
  TYPES.GetDataFromApi
]
class WeightedAveragesReport {
  constructor (
    rService,
    getDataFromApi
  ) {
    this.rService = rService
    this.getDataFromApi = getDataFromApi
  }

  async getWeightedAveragesReport (args = {}) {
    const {
      auth = {},
      params = {}
    } = args ?? {}

    const {
      start = 0,
      end = Date.now(),
      symbol: _symbol = []
    } = params ?? {}
    const symbolArr = Array.isArray(_symbol)
      ? _symbol
      : [_symbol]
    const symbol = symbolArr.filter((s) => (
      s && typeof s === 'string'
    ))

    const trades = await this._getTrades({
      auth,
      start,
      end,
      symbol
    })
    const calcedTrades = this._calcTrades(trades)

    return calcedTrades
  }

  async _getTrades (args) {
    const limit = 2000
    const start = args?.start ?? 0
    const symbol = args?.symbol?.length > 0
      ? { symbol: args.symbol }
      : {}

    let end = args?.end ?? Date.now()
    let prevEnd = end
    let serialRequestsCount = 0
    let count = 0

    const trades = []

    while (true) {
      let {
        res,
        nextPage
      } = await this.getDataFromApi({
        getData: this.rService.getTrades.bind(this.rService),
        args: {
          auth: args?.auth ?? {},
          params: { start, end, ...symbol },
          notThrowError: true
        },
        callerName: 'WEIGHTED_AVERAGES',
        eNetErrorAttemptsTimeframeMin: 10 / 60,
        eNetErrorAttemptsTimeoutMs: 1000,
        shouldNotInterrupt: true
      })

      prevEnd = end
      end = nextPage

      if (
        Array.isArray(res) &&
        res.length === 0 &&
        nextPage &&
        Number.isInteger(nextPage) &&
        serialRequestsCount < 1
      ) {
        serialRequestsCount += 1

        continue
      }

      serialRequestsCount = 0

      if (
        !Array.isArray(res) ||
        res.length === 0
      ) {
        break
      }

      const lastItem = res[res.length - 1]
      const lastMts = lastItem?.mtsCreate
      let isAllData = false

      if (
        !lastItem ||
        typeof lastItem !== 'object' ||
        !lastMts ||
        !Number.isInteger(lastMts)
      ) {
        break
      }

      if (start >= lastMts) {
        res = res.filter((item) => start <= item?.mtsCreate)
        isAllData = true
      }
      // After reducing between start/end timeframe check trades count limitation
      if (limit < (count + res.length)) {
        throw new MaxWeightedAveragesReportTradesNumError()
      }
      if (
        process.env.NODE_ENV === 'test' &&
        prevEnd === end
      ) {
        isAllData = true
      }

      trades.push(...res)
      count += res.length

      if (
        isAllData ||
        !end ||
        !Number.isInteger(end)
      ) {
        break
      }
    }

    return trades
  }

  _calcTrades (trades = []) {
    const symbResMap = new Map()

    for (const trade of trades) {
      const {
        symbol,
        execAmount,
        execPrice
      } = trade ?? {}

      if (
        !symbol ||
        typeof symbol !== 'string' ||
        !Number.isFinite(execAmount) ||
        execAmount === 0 ||
        !Number.isFinite(execPrice) ||
        execPrice === 0
      ) {
        continue
      }

      const isBuying = execAmount > 0
      const spent = execAmount * execPrice

      const existedSymbRes = symbResMap.get(symbol)
      const {
        sumSpent: _sumSpent = 0,
        sumAmount: _sumAmount = 0,
        sumBuyingSpent: _sumBuyingSpent = 0,
        sumBuyingAmount: _sumBuyingAmount = 0,
        sumSellingSpent: _sumSellingSpent = 0,
        sumSellingAmount: _sumSellingAmount = 0
      } = existedSymbRes ?? {}

      const sumSpent = Number.isFinite(spent)
        ? _sumSpent + spent
        : _sumSpent
      const sumAmount = _sumAmount + execAmount
      const sumBuyingSpent = (
        isBuying &&
        Number.isFinite(spent)
      )
        ? _sumBuyingSpent + spent
        : _sumBuyingSpent
      const sumBuyingAmount = isBuying
        ? _sumBuyingAmount + execAmount
        : _sumBuyingAmount
      const sumSellingSpent = (
        !isBuying &&
        Number.isFinite(spent)
      )
        ? _sumSellingSpent + spent
        : _sumSellingSpent
      const sumSellingAmount = !isBuying
        ? _sumSellingAmount + execAmount
        : _sumSellingAmount

      symbResMap.set(symbol, {
        sumSpent,
        sumAmount,
        sumBuyingSpent,
        sumBuyingAmount,
        sumSellingSpent,
        sumSellingAmount,

        buyingWeightedPrice: sumBuyingAmount === 0
          ? 0
          : sumBuyingSpent / sumBuyingAmount,
        buyingAmount: sumBuyingAmount,
        sellingWeightedPrice: sumSellingAmount === 0
          ? 0
          : sumSellingSpent / sumSellingAmount,
        sellingAmount: sumSellingAmount,
        cumulativeWeightedPrice: sumAmount === 0
          ? 0
          : sumSpent / sumAmount,
        cumulativeAmount: sumAmount
      })
    }

    return [...symbResMap].map(([symbol, val]) => {
      const {
        buyingWeightedPrice = 0,
        buyingAmount = 0,
        sellingWeightedPrice = 0,
        sellingAmount = 0,
        cumulativeWeightedPrice = 0,
        cumulativeAmount = 0
      } = val ?? {}

      return {
        symbol,
        buyingWeightedPrice,
        buyingAmount,
        sellingWeightedPrice,
        sellingAmount,
        cumulativeWeightedPrice,
        cumulativeAmount
      }
    })
  }
}

decorateInjectable(WeightedAveragesReport, depsTypes)

module.exports = WeightedAveragesReport
