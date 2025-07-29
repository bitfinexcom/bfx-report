'use strict'

const SCHEMA_IDS = require('../schema.ids')

module.exports = {
  $id: SCHEMA_IDS.DEFS,
  definitions: {
    milliseconds: {
      type: 'boolean'
    },
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
    strSymbol: {
      type: 'string',
      minLength: 3
    },
    symbol: {
      type: ['string', 'array'],
      if: {
        type: 'array'
      },
      then: {
        uniqueItems: true,
        items: {
          $ref: '#/definitions/strSymbol'
        }
      },
      else: {
        $ref: '#/definitions/strSymbol'
      }
    },
    symbolWithMinItem: {
      type: ['string', 'array'],
      if: {
        type: 'array'
      },
      then: {
        uniqueItems: true,
        minItems: 1,
        items: {
          $ref: '#/definitions/strSymbol'
        }
      },
      else: {
        $ref: '#/definitions/strSymbol'
      }
    },
    symbolWithMaxItem: {
      type: ['string', 'array'],
      if: {
        type: 'array'
      },
      then: {
        uniqueItems: true,
        maxItems: 1,
        items: {
          $ref: '#/definitions/strSymbol'
        }
      },
      else: {
        $ref: '#/definitions/strSymbol'
      }
    },
    symbolWithMinMaxItem: {
      type: ['string', 'array'],
      if: {
        type: 'array'
      },
      then: {
        uniqueItems: true,
        minItems: 1,
        maxItems: 1,
        items: {
          $ref: '#/definitions/strSymbol'
        }
      },
      else: {
        $ref: '#/definitions/strSymbol'
      }
    },
    sort: {
      type: 'integer',
      enum: [1, -1]
    },
    email: {
      type: 'string',
      format: 'email'
    },
    strId: {
      type: 'string',
      minLength: 1
    },
    intId: {
      type: 'integer',
      minimum: 0
    },
    arrId: {
      type: 'array',
      uniqueItems: true,
      minItems: 1,
      items: {
        $ref: '#/definitions/intId'
      }
    },
    filter: {
      type: 'object'
    },
    notCheckNextPage: {
      type: 'boolean'
    },
    notThrowError: {
      type: 'boolean'
    },
    isSyncRequest: {
      type: 'boolean'
    },
    isPDFRequired: {
      type: 'boolean'
    },
    isSignatureRequired: {
      type: 'boolean'
    },
    method: {
      type: 'string'
    }
  }
}
