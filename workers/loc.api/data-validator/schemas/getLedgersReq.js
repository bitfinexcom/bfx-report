'use strict'

const SCHEMA_IDS = require('../schema.ids')

module.exports = {
  $id: SCHEMA_IDS.GET_LEDGERS_REQ,
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
