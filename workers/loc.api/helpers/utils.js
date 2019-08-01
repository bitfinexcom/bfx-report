'use strict'

const { transform } = require('lodash')
const LRU = require('lru')

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

const accountCache = new LRU({ maxAge: 900000, max: 1 })

module.exports = {
  parseFields,
  accountCache
}
