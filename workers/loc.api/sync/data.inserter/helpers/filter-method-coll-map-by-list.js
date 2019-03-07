'use strict'

const { getMethodCollMap } = require('../../schema')
const ALLOWED_COLLS = require('../../allowed.colls')

const _reduceMethodCollMap = (
  _methodCollMap,
  res,
  cb = () => true
) => {
  return [..._methodCollMap].reduce((accum, curr) => {
    if (
      accum.every(item => item.name !== curr[1].name) &&
      res.every(item => item.name !== curr[1].name) &&
      cb(curr)
    ) {
      accum.push(curr)
    }

    return accum
  }, [])
}

const _isPubColl = (coll) => {
  return /^public:.*/i.test(coll[1].type)
}

const _isAllowedColl = (coll, allowedCollsNames) => {
  return allowedCollsNames.some(item => item === coll[1].name)
}

module.exports = (
  methodCollMap,
  syncColls,
  allowedCollsNames
) => {
  const res = []
  const _methodCollMap = (methodCollMap instanceof Map)
    ? new Map(methodCollMap)
    : getMethodCollMap()

  for (const collName of syncColls) {
    if (collName === ALLOWED_COLLS.ALL) {
      const subRes = _reduceMethodCollMap(
        _methodCollMap,
        res,
        coll => _isAllowedColl(coll, allowedCollsNames)
      )

      res.push(...subRes)

      break
    }
    if (collName === ALLOWED_COLLS.PUBLIC) {
      const subRes = _reduceMethodCollMap(
        _methodCollMap,
        res,
        coll => (
          (_isAllowedColl(coll, allowedCollsNames) &&
          _isPubColl(coll))
        )
      )

      res.push(...subRes)

      continue
    }
    if (collName === ALLOWED_COLLS.PRIVATE) {
      const subRes = _reduceMethodCollMap(
        _methodCollMap,
        res,
        coll => (
          (_isAllowedColl(coll, allowedCollsNames) &&
          !_isPubColl(coll))
        )
      )

      res.push(...subRes)

      continue
    }

    const subRes = _reduceMethodCollMap(
      _methodCollMap,
      res,
      curr => curr[1].name === collName
    )

    res.push(...subRes)
  }

  return new Map(res)
}
