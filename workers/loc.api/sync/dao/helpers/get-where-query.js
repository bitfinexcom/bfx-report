'use strict'

const { omit } = require('lodash')

const { serializeVal } = require('./serialization')

const _getCompareOperator = (
  origFieldName,
  isArr,
  gtKeys,
  ltKeys,
  isNot
) => {
  if (origFieldName === 'start') {
    return '>='
  }
  if (origFieldName === 'end') {
    return '<='
  }
  if (
    Array.isArray(gtKeys) &&
    gtKeys.some(key => key === origFieldName)
  ) {
    return '>'
  }
  if (
    Array.isArray(ltKeys) &&
    ltKeys.some(key => key === origFieldName)
  ) {
    return '<'
  }
  if (isArr) {
    return isNot ? 'NOT IN' : 'IN'
  }

  return isNot ? '!=' : '='
}

const _getKeysAndValuesForWhereQuery = (
  filter,
  origFieldName,
  isArr
) => {
  if (!isArr) {
    const key = `$${origFieldName}`
    const subValues = { [key]: serializeVal(filter[origFieldName]) }

    return { key, subValues }
  }

  const subValues = {}
  const preKey = filter[origFieldName].map((item, j) => {
    const subKey = `$${origFieldName}_${j}`
    subValues[subKey] = serializeVal(item)

    return subKey
  }).join(', ')

  const key = `(${preKey})`

  return { key, subValues }
}

const _getIsNullOperator = (
  fieldName,
  filter
) => {
  if (
    fieldName !== '$isNull' ||
    (
      Array.isArray(filter[fieldName]) &&
      filter[fieldName].length === 0
    )
  ) {
    return false
  }

  return Array.isArray(filter[fieldName])
    ? filter[fieldName].map(name => `${name} IS NULL`).join(' AND ')
    : `${filter[fieldName]} IS NULL`
}

module.exports = (filter = {}, isNotSetWhereClause) => {
  let values = {}

  const gtObj = filter.$gt && typeof filter.$gt === 'object'
    ? filter.$gt
    : {}
  const ltObj = filter.$lt && typeof filter.$lt === 'object'
    ? filter.$lt
    : {}
  const notObj = filter.$not && typeof filter.$not === 'object'
    ? filter.$not
    : {}
  const _filter = {
    ...omit(filter, ['$gt', '$lt', '$not']),
    ...gtObj,
    ...ltObj,
    ...notObj
  }
  const keys = Object.keys(omit(_filter, ['_dateFieldName']))
  const where = keys.reduce(
    (accum, curr, i) => {
      const isArr = Array.isArray(_filter[curr])
      const isNullOp = _getIsNullOperator(curr, _filter)

      if (isNullOp) {
        return `${accum}${i > 0 ? ' AND ' : ''}${isNullOp}`
      }

      const fieldName = (curr === 'start' || curr === 'end')
        ? _filter._dateFieldName
        : curr
      const compareOperator = _getCompareOperator(
        curr,
        isArr,
        Object.keys(gtObj),
        Object.keys(ltObj),
        Object.keys(notObj).length > 0
      )

      const {
        key,
        subValues
      } = _getKeysAndValuesForWhereQuery(_filter, curr, isArr)

      values = { ...values, ...subValues }

      return `${accum}${i > 0 ? ' AND ' : ''}${fieldName} ${compareOperator} ${key}`
    },
    (isNotSetWhereClause || keys.length === 0)
      ? '' : 'WHERE '
  )

  return { where, values }
}
