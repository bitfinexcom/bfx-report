'use strict'

const SCHEMA_IDS = require('../schema.ids')

module.exports = {
  $id: SCHEMA_IDS.COMMON_FILE_REQ,
  type: 'object',
  additionalProperties: false,
  properties: {
    method: {
      $ref: 'defs#/definitions/method'
    },
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
      $ref: 'defs#/definitions/symbolWithMinItem'
    },
    filter: {
      $ref: 'defs#/definitions/filter'
    },

    milliseconds: {
      $ref: 'defs#/definitions/milliseconds'
    },
    dateFormat: {
      $ref: 'defs#/definitions/dateFormat'
    },
    language: {
      $ref: 'defs#/definitions/language'
    },
    timezone: {
      $ref: 'defs#/definitions/timezone'
    },
    isPDFRequired: {
      $ref: 'defs#/definitions/isPDFRequired'
    },
    isSignatureRequired: {
      $ref: 'defs#/definitions/isSignatureRequired'
    }
  }
}
