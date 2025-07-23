'use strict'

const FILTER_SCHEMA_IDS = require('../../filter.schema.ids')

module.exports = new Map([
  [
    FILTER_SCHEMA_IDS.GET_POSITIONS_HISTORY_REQ_FILTER,
    {
      id: { type: 'integer' },
      symbol: { type: 'string' },
      status: { type: 'string' },
      amount: { type: 'number' },
      basePrice: { type: 'number' },
      closePrice: { type: 'number' },
      marginFunding: { type: 'number' },
      marginFundingType: { type: 'integer' },
      pl: { type: 'number' },
      plPerc: { type: 'number' },
      liquidationPrice: { type: 'number' },
      leverage: { type: 'number' },
      placeholder: { type: 'string' },
      mtsCreate: { type: 'integer' },
      mtsUpdate: { type: 'integer' }
    }
  ]
])
