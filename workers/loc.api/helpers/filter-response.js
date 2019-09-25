'use strict'

const FILTER_CONDITIONS = require('./filter.conditions')

const SPECIAL_CHARS = [
  '-',
  '[',
  ']',
  '/',
  '{',
  '}',
  '(',
  ')',
  '*',
  '+',
  '?',
  '.',
  '^',
  '$',
  '|'
]

const replaceStr = (str, from, to) => {
  const regExp = RegExp(`(.?)(${from})`, 'gi')

  return str.replace(regExp, (match, p1) => {
    if (p1 !== '\\') {
      return `${p1}${to}`
    }

    return match
  })
}

const _isNull = (val) => {
  return (
    val === null ||
    typeof val === 'undefined'
  )
}

const _getComparator = (
  fieldName,
  value
) => {
  const eqFn = (item) => (
    !_isNull(item) &&
    item === value
  )
  const neFn = (item) => (
    !_isNull(item) &&
    item !== value
  )

  if (fieldName === FILTER_CONDITIONS.GT) {
    return (item) => (
      !_isNull(item) &&
      item > value
    )
  }
  if (fieldName === FILTER_CONDITIONS.GTE) {
    return (item) => (
      !_isNull(item) &&
      item >= value
    )
  }
  if (fieldName === FILTER_CONDITIONS.LT) {
    return (item) => (
      !_isNull(item) &&
      item < value
    )
  }
  if (fieldName === FILTER_CONDITIONS.LTE) {
    return (item) => (
      !_isNull(item) &&
      item <= value
    )
  }
  if (fieldName === FILTER_CONDITIONS.LIKE) {
    const escapeRegExp = RegExp(`[${SPECIAL_CHARS.join('\\')}]`, 'g')
    const escapedStr = value.replace(escapeRegExp, '\\$&')
    const _str = replaceStr(escapedStr, '%', '.*')
    const str = replaceStr(_str, '_', '.')

    const regexp = new RegExp(`^${str}$`)

    return (item) => (
      typeof item === 'string' &&
      regexp.test(item)
    )
  }
  if (fieldName === FILTER_CONDITIONS.NE) {
    return neFn
  }
  if (fieldName === FILTER_CONDITIONS.EQ) {
    return eqFn
  }
  if (Array.isArray(value)) {
    const inFn = (item) => value.some((subItem) => (
      !_isNull(item) &&
      item === subItem
    ))
    const ninFn = (item) => value.every((subItem) => (
      !_isNull(item) &&
      item !== subItem
    ))

    if (fieldName === FILTER_CONDITIONS.IN) {
      return inFn
    }
    if (fieldName === FILTER_CONDITIONS.NIN) {
      return ninFn
    }

    return fieldName === FILTER_CONDITIONS.NOT
      ? ninFn
      : inFn
  }

  return fieldName === FILTER_CONDITIONS.NOT
    ? neFn
    : eqFn
}

const _isOrOp = (filter) => (
  filter &&
  typeof filter === 'object' &&
  filter[FILTER_CONDITIONS.OR] &&
  typeof filter[FILTER_CONDITIONS.OR] === 'object'
)

const _isCondition = (
  conditions,
  fieldName
) => {
  return conditions.some(condition => (
    condition === fieldName
  ))
}

const _getIsNullComparator = (
  fieldName,
  value
) => {
  if (
    (
      fieldName !== FILTER_CONDITIONS.IS_NULL &&
      fieldName !== FILTER_CONDITIONS.IS_NOT_NULL
    ) ||
    (
      Array.isArray(value) &&
      value.length === 0
    )
  ) {
    return false
  }

  const valueArr = Array.isArray(value)
    ? value
    : [value]

  return (item) => valueArr.every((val) => (
    fieldName === FILTER_CONDITIONS.IS_NULL
      ? _isNull(item[val])
      : !_isNull(item[val])
  ))
}

module.exports = (
  data = [],
  filter = {}
) => {
  if (
    !filter ||
    typeof filter !== 'object' ||
    Object.keys(filter).length === 0
  ) {
    return data
  }
  if (
    !Array.isArray(data) ||
    data.length === 0 ||
    data.some(item => !item || typeof item !== 'object')
  ) {
    return []
  }

  const isOrOp = _isOrOp(filter)
  const _filter = isOrOp
    ? { ...filter[FILTER_CONDITIONS.OR] }
    : { ...filter }
  const conditions = [
    FILTER_CONDITIONS.GT,
    FILTER_CONDITIONS.GTE,
    FILTER_CONDITIONS.LT,
    FILTER_CONDITIONS.LTE,
    FILTER_CONDITIONS.NOT,
    FILTER_CONDITIONS.LIKE,
    FILTER_CONDITIONS.EQ,
    FILTER_CONDITIONS.NE,
    FILTER_CONDITIONS.IN,
    FILTER_CONDITIONS.NIN
  ]
  const keys = Object.keys(_filter)

  const res = data.filter((item) => {
    const comparators = keys.reduce(
      (accum, fieldName) => {
        const value = _filter[fieldName]
        const isNullComparator = _getIsNullComparator(
          fieldName,
          value
        )

        if (isNullComparator) {
          accum.push(() => isNullComparator(item))

          return accum
        }
        if (_isCondition(
          conditions,
          fieldName
        )) {
          const condFilter = (
            _filter[fieldName] &&
            typeof _filter[fieldName] === 'object'
          )
            ? _filter[fieldName]
            : {}
          const condKeys = Object.keys(condFilter)
          const condComparators = condKeys.reduce(
            (condAccum, curr) => {
              const comparator = _getComparator(
                fieldName,
                condFilter[curr]
              )

              accum.push(() => comparator(item[curr]))

              return condAccum
            }, [])

          accum.push(...condComparators)

          return accum
        }

        const comparator = _getComparator(
          fieldName,
          value
        )
        accum.push(() => comparator(item[fieldName]))

        return accum
      }, [])

    return isOrOp
      ? comparators.some((compFn) => compFn())
      : comparators.every((compFn) => compFn())
  })

  return res
}
