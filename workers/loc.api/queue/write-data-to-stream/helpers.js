'use strict'

const { cloneDeep } = require('lodash')
const moment = require('moment-timezone')

const {
  isRateLimitError,
  isNonceSmallError
} = require('../../helpers/api-errors-testers')

const _delay = (mc = 80000) => {
  return new Promise((resolve) => {
    setTimeout(resolve, mc)
  })
}

const _validTxtTimeZone = (val, timezone, format) => {
  try {
    return moment(val).tz(timezone).format(format)
  } catch (e) {
    return moment(val).utcOffset(0).format(format)
  }
}

const _formatters = {
  date: (
    val,
    {
      timezone = 0,
      dateFormat = 'YY-MM-DD',
      milliseconds = false
    }
  ) => {
    if (Number.isInteger(val)) {
      const _ms = milliseconds ? '.SSS' : ''
      const format = `${dateFormat} HH:mm:ss${_ms}`

      return Number.isFinite(timezone)
        ? moment(val).utcOffset(timezone).format(format)
        : _validTxtTimeZone(val, timezone, format)
    }

    return val
  },
  symbol: symbol => {
    if (
      symbol.length > 6 &&
      /.+[:].+/.test(symbol)
    ) {
      const str = (
        symbol[0] === 't' ||
        symbol[0] === 'f'
      )
        ? symbol.slice(1)
        : symbol

      return str.split(':').join('/')
    }
    if (
      symbol[0] !== 't' &&
      symbol[0] !== 'f'
    ) {
      return symbol
    }
    if (
      symbol.length > 4 &&
      symbol.length < 7
    ) {
      return symbol.slice(1)
    }

    return `${symbol.slice(1, 4)}${symbol[4]
      ? '/' : ''}${symbol.slice(4, 7)}`
  },
  side: side => {
    let msg

    if (side === 1) {
      msg = 'PROVIDED'
    } else if (side === 0) {
      msg = 'BOTH'
    } else if (side === -1) {
      msg = 'TAKEN'
    } else {
      msg = 'NULL'
    }

    return msg
  }
}

const _dataFormatter = (obj, formatSettings, params) => {
  if (
    typeof obj !== 'object' ||
    typeof formatSettings !== 'object'
  ) {
    return obj
  }

  const res = cloneDeep(obj)

  Object.entries(formatSettings).forEach(([key, val]) => {
    try {
      if (
        typeof obj[key] !== 'undefined' &&
        typeof _formatters[val] === 'function'
      ) {
        res[key] = _formatters[val](obj[key], params)
      }
    } catch (err) {}
  })

  return res
}

const _normalizers = {
  getPublicTrades: (obj, params) => {
    if (
      params &&
      typeof params === 'object' &&
      typeof params.symbol === 'string'
    ) {
      obj.symbol = params.symbol
    }

    return obj
  }
}

const _dataNormalizer = (obj, method, params) => {
  if (
    typeof obj !== 'object' ||
    typeof _normalizers[method] !== 'function'
  ) {
    return obj
  }

  let res = cloneDeep(obj)

  try {
    res = _normalizers[method](res, params)
  } catch (err) {}

  return res
}

const write = (
  res,
  stream,
  formatSettings,
  params,
  method
) => {
  res.forEach((item) => {
    const _item = _dataNormalizer(item, method, params)
    const res = _dataFormatter(_item, formatSettings, params)

    stream.write(res)
  })
}

const writeMessageToStream = (
  processorQueue,
  stream,
  message
) => {
  processorQueue.emit('progress', 0)

  write([message], stream)

  processorQueue.emit('progress', 100)
}

const setDefaultPrams = (args) => {
  args.params.notThrowError = true
  args.params.end = args.params.end
    ? Math.min(args.params.end, Date.now())
    : Date.now()
  args.params.start = args.params.start
    ? args.params.start
    : 0
}

const getDataFromApi = async (getData, args) => {
  const ms = 80000

  let countRateLimitError = 0
  let countNonceSmallError = 0
  let res = null

  while (true) {
    try {
      res = await getData(null, cloneDeep(args))

      break
    } catch (err) {
      if (isRateLimitError(err)) {
        countRateLimitError += 1

        if (countRateLimitError > 2) {
          throw err
        }

        await _delay(ms)

        continue
      } else if (isNonceSmallError(err)) {
        countNonceSmallError += 1

        if (countNonceSmallError > 20) {
          throw err
        }

        await _delay(1000)

        continue
      } else throw err
    }
  }

  return res
}

const filterMovementsByAmount = (res, { params }) => {
  const {
    isDeposits,
    isWithdrawals
  } = { ...params }

  if (
    !Array.isArray(res) ||
    (!isDeposits && !isWithdrawals)
  ) {
    return res
  }

  return res.filter((item) => {
    return isDeposits
      ? item.amount > 0
      : item.amount < 0
  })
}

const progress = (
  queue,
  currTime,
  { start, end }
) => {
  const percent = Math.round(
    ((currTime - start) / (end - start)) * 100
  )

  queue.emit('progress', percent)
}

module.exports = {
  writeMessageToStream,
  setDefaultPrams,
  getDataFromApi,
  filterMovementsByAmount,
  write,
  progress
}
