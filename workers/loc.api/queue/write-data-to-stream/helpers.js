'use strict'

const { cloneDeep, isObject } = require('lodash')
const moment = require('moment-timezone')

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

const _symbNormalizer = (obj, params) => {
  const { symbol } = { ...params }
  const _symbol = Array.isArray(symbol)
    ? symbol[0]
    : symbol

  if (typeof _symbol !== 'string') {
    return obj
  }

  return {
    ...obj,
    symbol: _symbol
  }
}

const _normalizers = {
  getPublicTrades: _symbNormalizer,
  getCandles: _symbNormalizer
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

const isSameRes = (prev = [], curr = []) => {
  if (
    !Array.isArray(prev) ||
    prev.length === 0 ||
    !Array.isArray(curr) ||
    curr.length === 0
  ) {
    return false
  }

  const keys = Object.entries(prev[0])
    .filter(([key, val]) => (/^(?!_)/.test(key)) && !isObject(val))
    .map(([key]) => key)

  return curr.some(currItem => {
    return prev.some(prevItem => {
      return keys.every(key => {
        return prevItem[key] === currItem[key]
      })
    })
  })
}

module.exports = {
  writeMessageToStream,
  setDefaultPrams,
  filterMovementsByAmount,
  write,
  progress,
  isSameRes
}
