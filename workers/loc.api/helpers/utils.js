'use strict'

const { transform } = require('lodash')
const LRU = require('lru')

const accountCache = new LRU({ maxAge: 900000, max: 1 })

const parseFields = (res, opts) => {
  const { executed, rate } = opts

  return transform(res, (result, obj) => {
    if (executed) {
      obj.amountExecuted = obj.amountOrig - obj.amount
    }
    if (rate) {
      obj.rate = obj.rate || 'Flash Return Rate'
    }

    result.push(obj)
  }, [])
}

const parseLoginsExtraDataFields = (res) => {
  if (
    !Array.isArray(res) ||
    res.length === 0
  ) {
    return res
  }

  return res.map((item) => {
    const { extraData } = { ...item }

    if (
      !extraData ||
      typeof extraData !== 'string'
    ) {
      return item
    }

    try {
      return {
        ...item,
        extraData: JSON.parse(extraData)
      }
    } catch (err) {
      return item
    }
  })
}

const parsePositionsAuditId = (args) => {
  const { params } = { ...args }
  const { id } = { ...params }
  const parsedId = Array.isArray(id)
    ? id.map(_id => (
        typeof _id === 'string' ? Number.parseInt(_id) : _id)
      )
    : id

  return {
    ...args,
    params: {
      ...params,
      id: parsedId
    }
  }
}

module.exports = {
  accountCache,
  parseFields,
  parseLoginsExtraDataFields,
  parsePositionsAuditId
}
