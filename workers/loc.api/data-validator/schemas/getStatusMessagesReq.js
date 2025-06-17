'use strict'

const SCHEMA_IDS = require('../schema.ids')

module.exports = {
  $id: SCHEMA_IDS.COMMON_REQ,
  type: 'object',
  additionalProperties: false,
  properties: {
    symbol: {
      $ref: 'defs#/definitions/symbolWithMinItem'
    },
    type: {
      type: 'string'
    },
    notCheckNextPage: {
      $ref: 'defs#/definitions/notCheckNextPage'
    },
    notThrowError: {
      $ref: 'defs#/definitions/notThrowError'
    }
  }
}
