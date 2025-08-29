'use strict'

const { cloneDeep } = require('lib-js-util-base')
const moment = require('moment-timezone')

const dataNormalizer = require('./data-normalizer')

const _validTxtTimeZone = (val, timezone, format) => {
  try {
    return moment(val).tz(timezone).format(format)
  } catch (e) {
    return moment(val).utcOffset(0).format(format)
  }
}

const _formatters = {
  prepareCurrency: (ccy, params) => {
    const currencyName = params?.allDataFields?.currencyName
    const currencyNameMap = params?.symbols?.currencyNameMap

    if (
      !ccy ||
      typeof ccy !== 'string' ||
      !currencyName ||
      typeof currencyName !== 'string' ||
      !currencyNameMap ||
      typeof currencyNameMap !== 'object'
    ) {
      return ccy
    }
    if (
      ccy !== 'USDt' &&
      ccy !== 'UST'
    ) {
      return ccy
    }

    const ccyId = currencyName.replace('TETHER', '')
    const name = currencyNameMap[ccyId]

    return name ?? ccy
  },
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

    const firstPart = symbol.slice(1, 4)
    const secondPart = symbol.slice(4, 7)
    const separator = symbol[4] ? '/' : ''

    return `${firstPart}${separator}${secondPart}`
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
  },
  lowerCaseWithUpperFirst: (str) => {
    if (
      !str ||
      typeof str !== 'string' ||
      str.length < 2
    ) {
      return str
    }

    const lower = str.toLowerCase()
    const normalized = lower.replace(/_/g, ' ')
    const head = normalized[0].toUpperCase()
    const tail = normalized.slice(1)

    return `${head}${tail}`
  }
}

const _dataFormatter = (data, formatSettings, params) => {
  if (
    typeof data !== 'object' ||
    typeof formatSettings !== 'object'
  ) {
    return data
  }

  const isArray = Array.isArray(data)
  const clonedData = cloneDeep(data)
  const objArr = isArray ? clonedData : [clonedData]

  for (const obj of objArr) {
    const formatterParams = {
      ...params,
      allDataFields: obj
    }

    for (const [key, val] of Object.entries(formatSettings)) {
      try {
        if (
          typeof obj[key] !== 'undefined' &&
          val &&
          typeof val === 'object'
        ) {
          obj[key] = _dataFormatter(obj[key], val, formatterParams)

          continue
        }
        if (
          typeof obj[key] !== 'undefined' &&
          typeof _formatters[val] === 'function'
        ) {
          obj[key] = _formatters[val](obj[key], formatterParams)

          continue
        }
      } catch (err) {}
    }
  }

  return isArray ? objArr : objArr[0]
}

const write = (
  res,
  stream,
  formatSettings,
  params,
  method
) => {
  const resArr = Array.isArray(res)
    ? res
    : [res]

  for (const item of resArr) {
    const _item = dataNormalizer(item, method, params)
    const res = _dataFormatter(_item, formatSettings, params)

    stream.write(res)
  }
}

const writeMessageToStream = (
  processorQueue,
  stream,
  message
) => {
  processorQueue.emit('progress', 0)

  write([{ message }], stream)

  processorQueue.emit('progress', 100)
}

const setDefaultParams = (args, method) => {
  if (method === 'getStatusMessages') {
    return
  }

  args.params.end = args.params.end
    ? Math.min(args.params.end, Date.now())
    : Date.now()

  if (
    method === 'getWallets' ||
    method === 'getPositionsSnapshot' ||
    method === 'getFullSnapshotReport'
  ) {
    return
  }

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

module.exports = {
  writeMessageToStream,
  setDefaultParams,
  filterMovementsByAmount,
  write,
  progress
}
