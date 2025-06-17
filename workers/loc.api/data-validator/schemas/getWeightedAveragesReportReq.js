'use strict'

const SCHEMA_IDS = require('../schema.ids')

module.exports = {
  $id: SCHEMA_IDS.GET_WEIGHTED_AVERAGES_REPORT_REQ,
  type: 'object',
  additionalProperties: false,
  required: ['symbol'],
  properties: {
    start: {
      $ref: 'defs#/definitions/start'
    },
    end: {
      $ref: 'defs#/definitions/end'
    },
    symbol: {
      $ref: 'defs#/definitions/symbolWithMaxItem'
    },
    notCheckNextPage: {
      $ref: 'defs#/definitions/notCheckNextPage'
    }
  }
}
