'use strict'

const { cloneDeep } = require('lib-js-util-base')

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
const language = { type: 'string' }

const paramsSchemaForPayInvoiceList = {
  ...paramsSchemaForApi,
  properties: {
    ...paramsSchemaForApi.properties,
    id: {
      type: 'string'
    }
  }
}

const paramsSchemaForPayInvoiceListFile = {
  type: 'object',
  properties: {
    ...paramsSchemaForPayInvoiceList.properties,
    timezone,
    dateFormat,
    language
  }
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

const paramsSchemaForWeightedAveragesReportApi = {
  type: 'object',
  properties: {
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
        maxItems: 1,
        items: {
          type: 'string'
        }
      }
    }
  }
}

const paramsSchemaForMovementInfo = {
  type: 'object',
  properties: {
    id: {
      type: 'integer'
    }
  }
}

const paramsSchemaForCandlesFile = {
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

const paramsSchemaForStatusMessagesFile = {
  type: 'object',
  properties: {
    ...paramsSchemaForStatusMessagesApi.properties,
    timezone,
    dateFormat,
    language
  }
}

const paramsSchemaForFile = {
  ...paramsSchemaForApi,
  properties: {
    ...paramsSchemaForApi.properties,
    timezone,
    dateFormat,
    language
  }
}

const paramsSchemaForPublicTradesFile = {
  ...paramsSchemaForFile,
  properties: {
    ...paramsSchemaForFile.properties,
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

const paramsSchemaForPositionsAuditFile = {
  ...paramsSchemaForFile,
  properties: {
    ...paramsSchemaForFile.properties,
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

const paramsSchemaForWalletsFile = {
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

const paramsSchemaForActivePositionsFile = {
  type: 'object',
  properties: {
    timezone,
    dateFormat,
    language
  }
}

const paramsSchemaForMultipleFile = {
  type: 'object',
  required: ['multiExport'],
  properties: {
    isPDFRequired: {
      type: 'boolean'
    },
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

const paramsSchemaForOrderTradesFile = {
  ...paramsSchemaForOrderTradesApi,
  properties: {
    ...paramsSchemaForOrderTradesApi.properties,
    timezone,
    dateFormat,
    language
  }
}

const paramsSchemaForWeightedAveragesReportFile = {
  type: 'object',
  properties: {
    ...cloneDeep(paramsSchemaForWeightedAveragesReportApi.properties),
    timezone,
    dateFormat,
    language
  }
}

module.exports = {
  paramsSchemaForApi,
  paramsSchemaForFile,
  paramsSchemaForPayInvoiceList,
  paramsSchemaForPayInvoiceListFile,
  paramsSchemaForPublicTradesFile,
  paramsSchemaForPublicTrades,
  paramsSchemaForPositionsAudit,
  paramsSchemaForPositionsAuditFile,
  paramsSchemaForWallets,
  paramsSchemaForWalletsFile,
  paramsSchemaForMultipleFile,
  paramsSchemaForActivePositionsFile,
  paramsSchemaForOrderTradesApi,
  paramsSchemaForOrderTradesFile,
  paramsSchemaForStatusMessagesApi,
  paramsSchemaForStatusMessagesFile,
  paramsSchemaForCandlesApi,
  paramsSchemaForCandlesFile,
  paramsSchemaForWeightedAveragesReportApi,
  paramsSchemaForWeightedAveragesReportFile,
  paramsSchemaForMovementInfo
}
