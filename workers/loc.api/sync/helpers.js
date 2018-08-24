'use strict'

const _methodCollMap = new Map([
  // ['_getEmail', 'email'],
  // ['_getSymbols', 'symbols'],
  ['_getLedgers', {
    name: 'ledgers',
    maxLimit: 5000,
    dateFieldName: 'mts',
    hasNewData: false
  }],
  ['_getTrades', {
    name: 'trades',
    maxLimit: 1500,
    dateFieldName: 'mtsCreate',
    hasNewData: false
  }],
  ['_getOrders', {
    name: 'orders',
    maxLimit: 5000,
    dateFieldName: 'mtsUpdate',
    hasNewData: false
  }],
  ['_getMovements', {
    name: 'movements',
    maxLimit: 25,
    dateFieldName: 'mtsUpdated',
    hasNewData: false
  }]
])

const getMethodCollMap = () => {
  return new Map(_methodCollMap)
}

const _getMethodArgMap = (
  method,
  auth = { apiKey: '', apiSecret: '' },
  limit,
  end = (new Date()).getTime(),
  start = 0
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
    (typeof data === 'string' && Object.keys(data).length === 0)
  )
}

const _compareElemsDbAndApi = (dateFieldName, elDb, elApi) => {
  const _elDb = Array.isArray(elDb) ? elDb[0] : elDb
  const _elApi = Array.isArray(elApi) ? elApi[0] : elApi

  return _elDb[dateFieldName] < _elApi[dateFieldName]
}

// TODO:
const checkNewData = async (reportService, auth) => {
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

      continue
    }

    if (_compareElemsDbAndApi(item.dateFieldName, lastElemFromDb, lastElemFromApi)) {
      methodCollMap.get(method).hasNewData = true
    }
  }

  return methodCollMap
}

module.exports = {
  getMethodCollMap,
  checkNewData
}
