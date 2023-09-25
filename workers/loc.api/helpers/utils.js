'use strict'

const LRU = require('lru')

const accountCache = new LRU({ maxAge: 900000, max: 1 })

const parseFields = (res, opts) => {
  const { executed, rate } = opts

  if (
    !Array.isArray(res) ||
    res.length === 0
  ) {
    return res
  }

  return res.reduce((accum, curr) => {
    if (
      !curr ||
      typeof curr !== 'object'
    ) {
      accum.push(curr)

      return accum
    }

    if (executed) {
      curr.amountExecuted = curr.amountOrig - curr.amount
    }
    if (rate) {
      curr.rate = curr.rate ?? 'Flash Return Rate'
    }

    accum.push(curr)

    return accum
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
