'use strict'

const { cloneDeep } = require('lib-js-util-base')

const FILTER_API_METHOD_NAMES = require('./filter.api.method.names')
const FILTER_CONDITIONS = require('./filter.conditions')

const _filterConditionsNames = Object
  .values(FILTER_CONDITIONS)

const _isCondition = (propName) => {
  return _filterConditionsNames.some((name) => {
    return propName === name
  })
}

const _normalizeProp = (
  filter,
  propName,
  propHandler = () => {},
  prevLevel = 0
) => {
  const level = prevLevel + 1

  if (level > 3) {
    return filter
  }

  const filterKeys = Object.entries(filter)

  for (const [name, val] of filterKeys) {
    if (
      name !== propName &&
      !_isCondition(name)
    ) {
      continue
    }
    if (
      val &&
      typeof val === 'object' &&
      !Array.isArray(val)
    ) {
      _normalizeProp(
        val,
        propName,
        propHandler,
        level
      )

      continue
    }
    if (name === propName) {
      filter[name] = propHandler(val)
    }
  }

  return filter
}

const _normalizers = {
  [FILTER_API_METHOD_NAMES.PUBLIC_TRADES] (filter) {
    return _normalizeProp(filter, 'rate', (val) => {
      return typeof val === 'string'
        ? Number.parseFloat(val)
        : val
    })
  }
}

module.exports = (
  methodApi,
  args = {}
) => {
  const { params } = { ...args }
  const { filter } = { ...params }

  if (
    !methodApi ||
    typeof methodApi !== 'string' ||
    !filter ||
    typeof filter !== 'object' ||
    Array.isArray(filter) ||
    Object.keys(filter).length === 0
  ) {
    return args
  }

  const normalizer = _normalizers[methodApi]
  const normFilter = typeof normalizer === 'function'
    ? normalizer(cloneDeep(filter))
    : filter

  return {
    ...args,
    params: {
      ...params,
      filter: normFilter
    }
  }
}
