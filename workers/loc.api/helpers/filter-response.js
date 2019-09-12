'use strict'

const _getComparator = (
  fieldName,
  value
) => {
  const eqFn = (item) => item === value
  const neFn = (item) => item !== value

  if (fieldName === '$gt') {
    return (item) => item > value
  }
  if (fieldName === '$gte') {
    return (item) => item >= value
  }
  if (fieldName === '$lt') {
    return (item) => item < value
  }
  if (fieldName === '$lte') {
    return (item) => item <= value
  }
  if (fieldName === '$like') {
    const str = value
      .replace(/%/gi, '.*')
      .replace(/_/gi, '\\s')
    const regexp = new RegExp(`^${str}$`)

    return (item) => (
      typeof item === 'string' &&
      regexp.test(item)
    )
  }
  if (fieldName === '$ne') {
    return (item) => item !== value
  }
  if (fieldName === '$eq') {
    return eqFn
  }
  if (Array.isArray(value)) {
    const inFn = (item) => value.some((subItem) => item === subItem)
    const ninFn = (item) => value.every((subItem) => item !== subItem)

    if (fieldName === '$in') {
      return inFn
    }
    if (fieldName === '$nin') {
      return (item) => value.every((subItem) => item !== subItem)
    }

    return fieldName === '$not'
      ? ninFn
      : inFn
  }

  return fieldName === '$not'
    ? neFn
    : eqFn
}

const _isOrOp = (filter) => (
  filter &&
  typeof filter === 'object' &&
  filter.$or &&
  typeof filter.$or === 'object'
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
  isOrOp,
  fieldName,
  value
) => {
  if (
    fieldName !== '$isNull' ||
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

  return (item) => isOrOp
    ? valueArr.some((val) => item[val])
    : valueArr.every((val) => item[val])
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
    ? { ...filter.$or }
    : { ...filter }
  const conditions = [
    '$gt',
    '$gte',
    '$lt',
    '$lte',
    '$not',
    '$like',
    '$eq',
    '$ne',
    '$in',
    '$nin'
  ]
  const keys = Object.keys(_filter)

  const res = data.filter((item) => {
    const comparators = keys.reduce(
      (accum, fieldName) => {
        const value = _filter[fieldName]
        const isNullComparator = _getIsNullComparator(
          isOrOp,
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
