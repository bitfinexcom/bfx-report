'use strict'

const SCHEMA_IDS = require('../schema.ids')

module.exports = {
  $id: SCHEMA_IDS.GET_LEDGERS_FILE_REQ,
  type: 'object',
  additionalProperties: false,
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
      $ref: 'defs#/definitions/symbolWithMinItem'
    },
    category: {
      type: ['string', 'integer'],
      if: {
        type: 'string'
      },
      then: {
        minLength: 1,
        pattern: '(^[1-9]\\d*$)|(^[0]$)'
      },
      else: {
        minimum: 0
      }
    },
    isMarginFundingPayment: {
      type: 'boolean'
    },
    isAffiliateRebate: {
      type: 'boolean'
    },
    isStakingPayments: {
      type: 'boolean'
    },
    filter: {
      $ref: 'defs#/definitions/filter'
    },

    email: {
      $ref: 'defs#/definitions/email'
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
