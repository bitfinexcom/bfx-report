'use strict'

const SCHEMA_IDS = require('../schema.ids')

module.exports = {
  $id: SCHEMA_IDS.GET_ORDER_TRADES_REQ,
  type: 'object',
  additionalProperties: false,
  required: ['id', 'symbol'],
  properties: {
    start: {
      $ref: 'defs#/definitions/start'
    },
    end: {
      $ref: 'defs#/definitions/end'
    },
    limit: {
      $ref: 'defs#/definitions/limit'
    },
    symbol: {
      $ref: 'defs#/definitions/symbolWithMinMaxItem'
    },
    id: {
      $ref: 'defs#/definitions/intId'
    },
    filter: {
      $ref: 'defs#/definitions/filter'
    },

    notCheckNextPage: {
      $ref: 'defs#/definitions/notCheckNextPage'
    },
    notThrowError: {
      $ref: 'defs#/definitions/notThrowError'
    },
    isSyncRequest: {
      $ref: 'defs#/definitions/isSyncRequest'
    }
  }
}
