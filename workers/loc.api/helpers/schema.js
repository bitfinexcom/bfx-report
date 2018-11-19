'use strict'

const paramsSchemaForApi = {
  type: 'object',
  properties: {
    limit: {
      type: 'integer'
    },
    start: {
      type: 'integer'
    },
    end: {
      type: 'integer'
    },
    symbol: {
      type: 'string'
    }
  }
}

const paramsSchemaForCsv = {
  type: 'object',
  properties: {
    limit: {
      type: 'integer'
    },
    start: {
      type: 'integer'
    },
    end: {
      type: 'integer'
    },
    symbol: {
      type: ['string', 'array'],
      if: {
        type: 'array'
      },
      then: {
        minItems: 2,
        items: {
          type: 'string'
        }
      }
    },
    timezone: {
      type: ['number', 'string']
    },
    dateFormat: {
      type: 'string',
      enum: ['DD-MM-YY', 'MM-DD-YY', 'YY-MM-DD']
    }
  }
}

const paramsSchemaForPublicTradesCsv = {
  ...paramsSchemaForCsv,
  properties: {
    ...paramsSchemaForCsv.properties,
    symbol: {
      type: 'string'
    }
  }
}

module.exports = {
  paramsSchemaForApi,
  paramsSchemaForCsv,
  paramsSchemaForPublicTradesCsv
}
