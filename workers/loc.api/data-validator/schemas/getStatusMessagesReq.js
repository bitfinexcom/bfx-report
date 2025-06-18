'use strict'

const SCHEMA_IDS = require('../schema.ids')

module.exports = {
  $id: SCHEMA_IDS.GET_STATUS_MESSAGES_REQ,
  type: 'object',
  additionalProperties: false,
  properties: {
    symbol: {
      $ref: 'defs#/definitions/symbolWithMinItem'
    },
    type: {
      type: 'string'
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
