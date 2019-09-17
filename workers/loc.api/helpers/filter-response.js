'use strict'

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

  if (fieldName === '$gt') {
    return (item) => (
      !_isNull(item) &&
      item > value
    )
  }
  if (fieldName === '$gte') {
    return (item) => (
      !_isNull(item) &&
      item >= value
    )
  }
  if (fieldName === '$lt') {
    return (item) => (
      !_isNull(item) &&
      item < value
    )
  }
  if (fieldName === '$lte') {
    return (item) => (
      !_isNull(item) &&
      item <= value
    )
  }
  if (fieldName === '$like') {
    const str = value
      .replace(/%/gi, '.*')
      .replace(/\\\.\*/gi, '%')
      .replace(/_/gi, '.')
      .replace(/\\\./gi, '_')
    const regexp = new RegExp(`^${str}$`)

    return (item) => (
      typeof item === 'string' &&
      regexp.test(item)
    )
  }
  if (fieldName === '$ne') {
    return neFn
  }
  if (fieldName === '$eq') {
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

    if (fieldName === '$in') {
      return inFn
    }
    if (fieldName === '$nin') {
      return ninFn
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
  fieldName,
  value
) => {
  if (
    (
      fieldName !== '$isNull' &&
      fieldName !== '$isNotNull'
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
    fieldName === '$isNull'
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
