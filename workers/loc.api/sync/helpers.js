'use strict'

const _ = require('lodash')

const _methodCollMap = new Map([
  ['_getLedgers', {
    name: 'ledgers',
    maxLimit: 5000,
    dateFieldName: 'mts',
    symbolFieldName: 'currency',
    hasNewData: false,
    start: 0
  }],
  ['_getTrades', {
    name: 'trades',
    maxLimit: 1500,
    dateFieldName: 'mtsCreate',
    symbolFieldName: 'pair',
    hasNewData: false,
    start: 0
  }],
  ['_getOrders', {
    name: 'orders',
    maxLimit: 5000,
    dateFieldName: 'mtsUpdate',
    symbolFieldName: 'symbol',
    hasNewData: false,
    start: 0
  }],
  ['_getMovements', {
    name: 'movements',
    maxLimit: 25,
    dateFieldName: 'mtsUpdated',
    symbolFieldName: 'currency',
    hasNewData: false,
    start: 0
  }]
])

const getMethodCollMap = () => {
  return new Map(_methodCollMap)
}

const _getMethodArgMap = (
  method,
  auth = { apiKey: '', apiSecret: '' },
  limit,
  start = 0,
  end = (new Date()).getTime()
) => {
  return {
    auth,
    params: {
      limit: limit !== null ? limit : _methodCollMap.get(method).maxLimit,
      end,
      start
    }
  }
}

const _isEmptyData = (data) => {
  return (
    !data ||
    (Array.isArray(data) && data.length === 0) ||
    (typeof data === 'object' && Object.keys(data).length === 0)
  )
}

const _compareElemsDbAndApi = (dateFieldName, elDb, elApi) => {
  const _elDb = Array.isArray(elDb) ? elDb[0] : elDb
  const _elApi = Array.isArray(elApi) ? elApi[0] : elApi

  return _elDb[dateFieldName] < _elApi[dateFieldName] || _elDb[dateFieldName]
}

const _checkNewData = async (reportService, auth) => {
  const methodCollMap = getMethodCollMap()

  for (let [method, item] of _methodCollMap) {
    const args = _getMethodArgMap(method, { ...auth }, 1)
    const lastElemFromDb = await reportService._getLastElemFromDb(item.name, item.dateFieldName)
    const lastElemFromApi = await reportService[method](args)

    methodCollMap.get(method).hasNewData = false

    if (_isEmptyData(lastElemFromApi)) {
      continue
    }

    if (_isEmptyData(lastElemFromDb)) {
      methodCollMap.get(method).hasNewData = true
      methodCollMap.get(method).start = 0

      continue
    }

    const lastDateInDb = _compareElemsDbAndApi(item.dateFieldName, lastElemFromDb, lastElemFromApi)
    if (lastDateInDb) {
      methodCollMap.get(method).hasNewData = true
      methodCollMap.get(method).start = lastDateInDb + 1
    }
  }

  return new Map([...methodCollMap].filter(([key, value]) => value.hasNewData))
}

const _delay = (mc = 80000) => {
  return new Promise((resolve) => {
    setTimeout(resolve, mc)
  })
}

const _isRateLimitError = (err) => {
  return /ERR_RATE_LIMIT/.test(err.toString())
}

const setProgress = (reportService, progress) => {
  reportService.ctx.grc_bfx.caller.syncProgress = progress
}

const getProgress = (reportService) => {
  return typeof reportService.ctx.grc_bfx.caller.syncProgress === 'number'
    ? reportService.ctx.grc_bfx.caller.syncProgress
    : false
}

const getAllAuth = (reportService) => {
  if (
    !reportService.ctx.grc_bfx.caller.auth ||
    !(reportService.ctx.grc_bfx.caller.auth instanceof Map)
  ) reportService.ctx.grc_bfx.caller.auth = new Map()

  return reportService.ctx.grc_bfx.caller.auth
}

const addAuth = (reportService, auth) => {
  return getAllAuth(reportService).set(auth.apiKey, auth)
}

const removeAuth = (reportService, apiKey) => {
  const auth = getAllAuth(reportService)
  auth.delete(apiKey)

  return auth
}

const _normalizeApiData = (data = []) => {
  return data.map(item => {
    if (
      typeof item !== 'object' ||
      !item._fieldKeys ||
      !Array.isArray(item._fieldKeys)
    ) {
      return item
    }

    return _.pick(item, item._fieldKeys)
  })
}

const _insertApiDataToDb = async (
  reportService,
  args,
  {
    methodApi,
    collName,
    dateFieldName
  }
) => {
  if (
    typeof reportService[methodApi] !== 'function'
  ) {
    throw new Error('ERR_METHOD_NOT_FOUND')
  }

  const _args = _.cloneDeep(args)
  const currIterationArgs = _.cloneDeep(_args)

  let res = null
  let count = 0

  while (true) {
    try {
      res = await reportService[methodApi](currIterationArgs)
    } catch (err) {
      if (_isRateLimitError(err)) {
        await _delay()
        res = await reportService[methodApi](currIterationArgs)
      } else throw err
    }

    if (
      !res ||
      !Array.isArray(res) ||
      res.length === 0
    ) break

    const lastItem = res[res.length - 1]

    if (
      typeof lastItem !== 'object' ||
      !lastItem[dateFieldName] ||
      !Number.isInteger(lastItem[dateFieldName])
    ) break

    const currTime = lastItem[dateFieldName]
    let isAllData = false

    if (_args.params.start >= currTime) {
      res = res.filter((item) => _args.params.start <= item[dateFieldName])
      isAllData = true
    }

    if (_args.params.limit < (count + res.length)) {
      res.splice(_args.params.limit - count)
      isAllData = true
    }

    await reportService._insertElemsToDb(collName, _normalizeApiData(res))

    count += res.length
    const needElems = _args.params.limit - count

    if (isAllData || needElems <= 0) {
      break
    }

    currIterationArgs.params.end = lastItem[dateFieldName] - 1
    if (needElems) currIterationArgs.params.limit = needElems
  }
}

const _insertNewDataToDb = async (reportService, auth, userProgress = 1) => {
  if (
    typeof auth.apiKey !== 'string' ||
    typeof auth.apiSecret !== 'string'
  ) {
    setProgress(reportService, false)

    return
  }

  const methodCollMap = await _checkNewData(reportService, auth)
  let count = 0

  for (const [method, item] of methodCollMap) {
    const args = _getMethodArgMap(method, { ...auth }, null, item.start)
    await _insertApiDataToDb(
      reportService,
      args,
      {
        methodApi: method,
        collName: item.name,
        dateFieldName: item.dateFieldName
      }
    )

    count += 1
    const progress = Math.round((count / methodCollMap.size) * 100 * userProgress)
    setProgress(reportService, progress)
  }
}

const insertNewDataToDbMultiUser = async (reportService) => {
  const auth = getAllAuth(reportService)

  if (
    !auth ||
    !(auth instanceof Map) ||
    auth.size === 0
  ) {
    setProgress(reportService, false)

    return
  }

  let count = 1

  for (const authItem of auth) {
    if (typeof authItem[1] !== 'object') {
      continue
    }

    const userProgress = count / auth.length
    await _insertNewDataToDb(reportService, authItem[1], userProgress)
    count += 1
  }
}

module.exports = {
  getMethodCollMap,
  insertNewDataToDbMultiUser,
  setProgress,
  getProgress,
  getAllAuth,
  addAuth,
  removeAuth
}
