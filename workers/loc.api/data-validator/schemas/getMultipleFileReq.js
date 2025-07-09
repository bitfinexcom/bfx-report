'use strict'

const SCHEMA_IDS = require('../schema.ids')

module.exports = {
  $id: SCHEMA_IDS.GET_MULTIPLE_FILE_REQ,
  type: 'object',
  additionalProperties: false,
  required: ['multiExport'],
  properties: {
    email: {
      $ref: 'defs#/definitions/email'
    },
    language: {
      $ref: 'defs#/definitions/language'
    },
    isPDFRequired: {
      $ref: 'defs#/definitions/isPDFRequired'
    },
    isSignatureRequired: {
      $ref: 'defs#/definitions/isSignatureRequired'
    },

    multiExport: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: true,
        required: ['method'],
        properties: {
          method: {
            $ref: 'defs#/definitions/method'
          }
        }
      }
    }
  }
}
