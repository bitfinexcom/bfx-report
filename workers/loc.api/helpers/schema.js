'use strict'

const _publicTradesSymbol = {
  type: ['string', 'array'],
  if: {
    type: 'array'
  },
  then: {
    maxItems: 1,
    items: {
      type: 'string'
    }
  }
}

const paramsSchemaForEditPublicСollsСonf = {
  type: ['array', 'object'],
  if: {
    type: 'array'
  },
  then: {
    minItems: 1,
    items: {
      type: 'object',
      required: ['symbol', 'start'],
      properties: {
        symbol: { type: 'string' },
        start: { type: 'integer' }
      }
    }
  },
  else: {
    required: ['symbol', 'start'],
    properties: {
      symbol: { type: 'string' },
      start: { type: 'integer' }
    }
  }
}

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
      type: ['string', 'array'],
      if: {
        type: 'array'
      },
      then: {
        minItems: 1,
        items: {
          type: 'string'
        }
      }
    }
  }
}

const timezone = {
  type: ['number', 'string']
}
const dateFormat = {
  type: 'string',
  enum: ['DD-MM-YY', 'MM-DD-YY', 'YY-MM-DD']
}
const language = {
  type: 'string',
  enum: ['en', 'ru', 'zh-CN', 'zh-TW']
}

const paramsSchemaForCsv = {
  ...paramsSchemaForApi,
  properties: {
    ...paramsSchemaForApi.properties,
    timezone,
    dateFormat,
    language
  }
}

const paramsSchemaForPublicTradesCsv = {
  ...paramsSchemaForCsv,
  properties: {
    ...paramsSchemaForCsv.properties,
    symbol: _publicTradesSymbol
  }
}

const paramsSchemaForPublicTrades = {
  ...paramsSchemaForApi,
  properties: {
    ...paramsSchemaForApi.properties,
    symbol: _publicTradesSymbol
  }
}

const paramsSchemaForPositionsAudit = {
  ...paramsSchemaForApi,
  required: [
    ...(Array.isArray(paramsSchemaForApi.required)
      ? paramsSchemaForApi.required
      : []
    ),
    'id'
  ],
  properties: {
    ...paramsSchemaForApi.properties,
    id: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'integer'
      }
    }
  }
}

const paramsSchemaForPositionsAuditCsv = {
  ...paramsSchemaForCsv,
  properties: {
    ...paramsSchemaForCsv.properties,
    ...paramsSchemaForPositionsAudit.properties
  }
}

const paramsSchemaForWallets = {
  type: 'object',
  properties: {
    end: {
      type: 'integer'
    }
  }
}

const paramsSchemaForWalletsCsv = {
  type: 'object',
  properties: {
    end: {
      type: 'integer'
    },
    timezone,
    dateFormat,
    language
  }
}

const paramsSchemaForActivePositionsCsv = {
  type: 'object',
  properties: {
    timezone,
    dateFormat,
    language
  }
}

const paramsSchemaForMultipleCsv = {
  type: 'object',
  required: ['multiExport'],
  properties: {
    email: {
      type: 'string'
    },
    multiExport: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['method'],
        properties: {
          method: {
            type: 'string'
          }
        }
      }
    }
  }
}

const paramsSchemaForOrderTradesApi = {
  type: 'object',
  required: ['id', 'symbol'],
  properties: {
    id: {
      type: 'integer'
    },
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
        minItems: 1,
        maxItems: 1,
        items: {
          type: 'string'
        }
      }
    }
  }
}

const paramsSchemaForOrderTradesCsv = {
  ...paramsSchemaForOrderTradesApi,
  properties: {
    ...paramsSchemaForOrderTradesApi.properties,
    timezone,
    dateFormat,
    language
  }
}

module.exports = {
  paramsSchemaForApi,
  paramsSchemaForCsv,
  paramsSchemaForPublicTradesCsv,
  paramsSchemaForPublicTrades,
  paramsSchemaForEditPublicСollsСonf,
  paramsSchemaForPositionsAudit,
  paramsSchemaForPositionsAuditCsv,
  paramsSchemaForWallets,
  paramsSchemaForWalletsCsv,
  paramsSchemaForMultipleCsv,
  paramsSchemaForActivePositionsCsv,
  paramsSchemaForOrderTradesApi,
  paramsSchemaForOrderTradesCsv
}
