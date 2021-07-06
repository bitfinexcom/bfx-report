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
  enum: [
    'DD-MM-YY',
    'DD-MM-YYYY',
    'MM-DD-YY',
    'MM-DD-YYYY',
    'YY-MM-DD',
    'YYYY-MM-DD'
  ]
}
const language = {
  type: 'string',
  enum: ['en', 'ru', 'zh-CN', 'zh-TW', 'es-EM']
}

const paramsSchemaForCandlesApi = {
  type: 'object',
  required: ['symbol'],
  properties: {
    timeframe: {
      type: 'string'
    },
    symbol: {
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
    },
    section: {
      type: 'string'
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
    sort: {
      type: 'integer'
    }
  }
}

const paramsSchemaForCandlesCsv = {
  type: 'object',
  properties: {
    ...paramsSchemaForCandlesApi.properties,
    timezone,
    dateFormat,
    language
  }
}

const paramsSchemaForStatusMessagesApi = {
  type: 'object',
  properties: {
    type: {
      type: 'string'
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

const paramsSchemaForStatusMessagesCsv = {
  type: 'object',
  properties: {
    ...paramsSchemaForStatusMessagesApi.properties,
    timezone,
    dateFormat,
    language
  }
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
    language,
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
  paramsSchemaForPositionsAudit,
  paramsSchemaForPositionsAuditCsv,
  paramsSchemaForWallets,
  paramsSchemaForWalletsCsv,
  paramsSchemaForMultipleCsv,
  paramsSchemaForActivePositionsCsv,
  paramsSchemaForOrderTradesApi,
  paramsSchemaForOrderTradesCsv,
  paramsSchemaForStatusMessagesApi,
  paramsSchemaForStatusMessagesCsv,
  paramsSchemaForCandlesApi,
  paramsSchemaForCandlesCsv
}
