'use strict'

const SCHEMA_IDS = require('../schema.ids')

module.exports = {
  $id: SCHEMA_IDS.DEFS,
  definitions: {
    dateFormat: {
      type: 'string',
      enum: [
        'DD-MM-YY',
        'DD-MM-YYYY',
        'MM-DD-YY',
        'MM-DD-YYYY',
        'YY-MM-DD',
        'YYYY-MM-DD'
      ]
    },
    language: {
      type: 'string',
      minLength: 2
    },
    timezone: {
      type: ['number', 'string']
    },
    start: {
      type: 'integer',
      minimum: 0
    },
    end: {
      type: 'integer',
      exclusiveMinimum: { $data: '1/start' },
      minimum: Date.UTC(2013)
    },
    limit: {
      type: 'integer',
      minimum: 1
    },
    symbol: {
      type: ['string', 'array'],
      if: {
        type: 'array'
      },
      then: {
        uniqueItems: true,
        minItems: 1,
        items: {
          type: 'string',
          minLength: 3
        }
      },
      else: {
        minLength: 3
      }
    }
  }
}
