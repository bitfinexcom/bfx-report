'use strict'

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

    // Used to switch data fetching from DB for framework mode
    this._isNotCalcTakenFromBfxApi = false
  }

  async getWeightedAveragesReport (args = {}, opts = {}) {
    const {
      auth = {},
      params = {}
    } = args ?? {}
    const {
      isNotCalcTakenFromBfxApi = this._isNotCalcTakenFromBfxApi
    } = opts ?? {}

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

    if (!isNotCalcTakenFromBfxApi) {
      return await this._getWeightedAveragesReportFromApi({
        auth,
        params: { start, end, symbol }
      })
    }

    const {
      res: trades,
      nextPage
    } = await this._getTrades({
      auth,
      start,
      end,
      symbol
    })
    const calcedTrades = this._calcTrades(trades)

    return {
      nextPage,
      res: calcedTrades
    }
  }

  async _getWeightedAveragesReportFromApi (args) {
    const limit = 100_000
    const symbols = args?.params?.symbol ?? []

    const weightedAverages = []

    // If `nextPage === true` it means that data is not consistent and need to change timeframe
    let nextPage = false

    /*
     * The loop here is to keep previous implementation,
     * amount of symbols is limited in params schema
     */
    for (const symbol of symbols) {
      const res = await this.getDataFromApi({
        getData: (space, _args) => this.rService._getWeightedAveragesReportFromApi(_args),
        args: {
          auth: args?.auth ?? {},
          params: { ...args?.params, limit, symbol },
          notThrowError: true
        },
        callerName: 'WEIGHTED_AVERAGES',
        eNetErrorAttemptsTimeframeMin: 10 / 60,
        eNetErrorAttemptsTimeoutMs: 1000,
        shouldNotInterrupt: true
      })

      const {
        tradeCount,
        sumBuyingSpent = 0,
        sumBuyingAmount = 0,
        sumSellingSpent = 0,
        sumSellingAmount = 0,
        buyingWeightedPrice = 0,
        sellingWeightedPrice = 0
      } = res ?? {}

      if (tradeCount >= limit) {
        nextPage = true
      }

      const cumulativeAmount = sumBuyingAmount + sumSellingAmount
      const cumulativeWeightedPrice = cumulativeAmount === 0
        ? 0
        : (sumBuyingSpent + sumSellingSpent) / cumulativeAmount

      weightedAverages.push({
        symbol,
        buyingWeightedPrice,
        buyingAmount: sumBuyingAmount,
        sellingWeightedPrice,
        sellingAmount: sumSellingAmount,
        cumulativeWeightedPrice,
        cumulativeAmount
      })
    }

    return {
      nextPage,
      res: weightedAverages
    }
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
    let nextPageRes = false

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
        res.splice(limit - count)
        nextPageRes = res[res.length - 1]?.mtsCreate ?? false
        isAllData = true
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

    return {
      nextPage: nextPageRes,
      res: trades
    }
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
