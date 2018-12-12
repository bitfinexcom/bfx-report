'use strict'

const { cloneDeep } = require('lodash')

const ALLOWED_COLLS = require('./allowed.colls')

const _models = new Map([
  [
    'users',
    {
      _id: 'INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT',
      email: 'VARCHAR(255)',
      apiKey: 'VARCHAR(255)',
      apiSecret: 'VARCHAR(255)',
      active: 'INT',
      isDataFromDb: 'INT',
      timezone: 'VARCHAR(255)'
    }
  ],
  [
    ALLOWED_COLLS.LEDGERS,
    {
      _id: 'INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT',
      id: 'BIGINT',
      currency: 'VARCHAR(255)',
      mts: 'BIGINT',
      amount: 'DECIMAL(22,12)',
      balance: 'DECIMAL(22,12)',
      description: 'TEXT',
      wallet: 'VARCHAR(255)',
      user_id: `INT NOT NULL,
        CONSTRAINT ledgers_fk_#{field}
        FOREIGN KEY (#{field})
        REFERENCES users(_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE`
    }
  ],
  [
    ALLOWED_COLLS.TRADES,
    {
      _id: 'INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT',
      id: 'BIGINT',
      symbol: 'VARCHAR(255)',
      mtsCreate: 'BIGINT',
      orderID: 'BIGINT',
      execAmount: 'DECIMAL(22,12)',
      execPrice: 'DECIMAL(22,12)',
      orderType: 'VARCHAR(255)',
      orderPrice: 'DECIMAL(22,12)',
      maker: 'INT',
      fee: 'DECIMAL(22,12)',
      feeCurrency: 'VARCHAR(255)',
      user_id: `INT NOT NULL,
        CONSTRAINT trades_fk_#{field}
        FOREIGN KEY (#{field})
        REFERENCES users(_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE`
    }
  ],
  [
    ALLOWED_COLLS.PUBLIC_TRADES,
    {
      _id: 'INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT',
      id: 'BIGINT',
      mts: 'BIGINT',
      amount: 'DECIMAL(22,12)',
      price: 'DECIMAL(22,12)',
      _symbol: 'VARCHAR(255)'
    }
  ],
  [
    ALLOWED_COLLS.ORDERS,
    {
      _id: 'INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT',
      id: 'BIGINT',
      gid: 'BIGINT',
      cid: 'BIGINT',
      symbol: 'VARCHAR(255)',
      mtsCreate: 'BIGINT',
      mtsUpdate: 'BIGINT',
      amount: 'DECIMAL(22,12)',
      amountOrig: 'DECIMAL(22,12)',
      type: 'VARCHAR(255)',
      typePrev: 'VARCHAR(255)',
      flags: 'INT',
      status: 'VARCHAR(255)',
      price: 'DECIMAL(22,12)',
      priceAvg: 'DECIMAL(22,12)',
      priceTrailing: 'DECIMAL(22,12)',
      priceAuxLimit: 'DECIMAL(22,12)',
      notify: 'INT',
      placedId: 'BIGINT',
      _lastAmount: 'DECIMAL(22,12)',
      amountExecuted: 'DECIMAL(22,12)',
      user_id: `INT NOT NULL,
        CONSTRAINT orders_fk_#{field}
        FOREIGN KEY (#{field})
        REFERENCES users(_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE`
    }
  ],
  [
    ALLOWED_COLLS.MOVEMENTS,
    {
      _id: 'INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT',
      id: 'BIGINT',
      currency: 'VARCHAR(255)',
      currencyName: 'VARCHAR(255)',
      mtsStarted: 'BIGINT',
      mtsUpdated: 'BIGINT',
      status: 'VARCHAR(255)',
      amount: 'DECIMAL(22,12)',
      fees: 'DECIMAL(22,12)',
      destinationAddress: 'VARCHAR(255)',
      transactionId: 'VARCHAR(255)',
      user_id: `INT NOT NULL,
        CONSTRAINT movements_fk_#{field}
        FOREIGN KEY (#{field})
        REFERENCES users(_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE`
    }
  ],
  [
    ALLOWED_COLLS.FUNDING_OFFER_HISTORY,
    {
      _id: 'INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT',
      id: 'BIGINT',
      symbol: 'VARCHAR(255)',
      mtsCreate: 'BIGINT',
      mtsUpdate: 'BIGINT',
      amount: 'DECIMAL(22,12)',
      amountOrig: 'DECIMAL(22,12)',
      type: 'VARCHAR(255)',
      flags: 'TEXT',
      status: 'TEXT',
      rate: 'VARCHAR(255)',
      period: 'INT',
      notify: 'INT',
      hidden: 'INT',
      renew: 'INT',
      rateReal: 'INT',
      amountExecuted: 'DECIMAL(22,12)',
      user_id: `INT NOT NULL,
        CONSTRAINT fundingOfferHistory_fk_#{field}
        FOREIGN KEY (#{field})
        REFERENCES users(_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE`
    }
  ],
  [
    ALLOWED_COLLS.FUNDING_LOAN_HISTORY,
    {
      _id: 'INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT',
      id: 'BIGINT',
      symbol: 'VARCHAR(255)',
      side: 'INT',
      mtsCreate: 'BIGINT',
      mtsUpdate: 'BIGINT',
      amount: 'DECIMAL(22,12)',
      flags: 'TEXT',
      status: 'TEXT',
      rate: 'VARCHAR(255)',
      period: 'INT',
      mtsOpening: 'BIGINT',
      mtsLastPayout: 'BIGINT',
      notify: 'INT',
      hidden: 'INT',
      renew: 'INT',
      rateReal: 'INT',
      noClose: 'INT',
      user_id: `INT NOT NULL,
        CONSTRAINT fundingLoanHistory_fk_#{field}
        FOREIGN KEY (#{field})
        REFERENCES users(_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE`
    }
  ],
  [
    ALLOWED_COLLS.FUNDING_CREDIT_HISTORY,
    {
      _id: 'INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT',
      id: 'BIGINT',
      symbol: 'VARCHAR(255)',
      side: 'INT',
      mtsCreate: 'BIGINT',
      mtsUpdate: 'BIGINT',
      amount: 'DECIMAL(22,12)',
      flags: 'TEXT',
      status: 'TEXT',
      rate: 'VARCHAR(255)',
      period: 'INT',
      mtsOpening: 'BIGINT',
      mtsLastPayout: 'BIGINT',
      notify: 'INT',
      hidden: 'INT',
      renew: 'INT',
      rateReal: 'INT',
      noClose: 'INT',
      positionPair: 'VARCHAR(255)',
      user_id: `INT NOT NULL,
        CONSTRAINT fundingCreditHistory_fk_#{field}
        FOREIGN KEY (#{field})
        REFERENCES users(_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE`
    }
  ],
  [
    'publicTradesConf',
    {
      _id: 'INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT',
      symbol: 'VARCHAR(255)',
      start: 'BIGINT',
      user_id: `INT NOT NULL,
        CONSTRAINT publicTradesConf_fk_#{field}
        FOREIGN KEY (#{field})
        REFERENCES users(_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE`
    }
  ],
  [
    ALLOWED_COLLS.SYMBOLS,
    {
      _id: 'INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT',
      pairs: 'VARCHAR(255)'
    }
  ],
  [
    ALLOWED_COLLS.CURRENCIES,
    {
      _id: 'INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT',
      id: 'VARCHAR(255)',
      name: 'VARCHAR(255)',
      pool: 'VARCHAR(255)',
      explorer: 'TEXT'
    }
  ],
  [
    'scheduler',
    {
      _id: 'INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT',
      isEnable: 'INT'
    }
  ],
  [
    'syncMode',
    {
      _id: 'INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT',
      isEnable: 'INT'
    }
  ],
  [
    'progress',
    {
      _id: 'INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT',
      value: 'VARCHAR(255)'
    }
  ]
])

const _methodCollMap = new Map([
  [
    '_getLedgers',
    {
      name: ALLOWED_COLLS.LEDGERS,
      maxLimit: 5000,
      dateFieldName: 'mts',
      symbolFieldName: 'currency',
      sort: [['mts', -1]],
      hasNewData: false,
      start: 0,
      type: 'insertable:array:objects',
      fieldsOfUniqueIndex: ['id', 'mts'],
      model: { ..._models.get(ALLOWED_COLLS.LEDGERS) }
    }
  ],
  [
    '_getTrades',
    {
      name: ALLOWED_COLLS.TRADES,
      maxLimit: 1500,
      dateFieldName: 'mtsCreate',
      symbolFieldName: 'symbol',
      sort: [['mtsCreate', -1]],
      hasNewData: false,
      start: 0,
      type: 'insertable:array:objects',
      fieldsOfUniqueIndex: ['id', 'mtsCreate', 'orderID', 'fee'],
      model: { ..._models.get(ALLOWED_COLLS.TRADES) }
    }
  ],
  [
    '_getPublicTrades',
    {
      name: ALLOWED_COLLS.PUBLIC_TRADES,
      maxLimit: 1000,
      dateFieldName: 'mts',
      symbolFieldName: '_symbol',
      sort: [['mts', -1]],
      hasNewData: false,
      start: [],
      type: 'public:insertable:array:objects',
      fieldsOfUniqueIndex: ['id', 'mts', '_symbol'],
      model: { ..._models.get(ALLOWED_COLLS.PUBLIC_TRADES) }
    }
  ],
  [
    '_getOrders',
    {
      name: ALLOWED_COLLS.ORDERS,
      maxLimit: 5000,
      dateFieldName: 'mtsUpdate',
      symbolFieldName: 'symbol',
      sort: [['mtsUpdate', -1]],
      hasNewData: false,
      start: 0,
      type: 'insertable:array:objects',
      fieldsOfUniqueIndex: ['id', 'mtsUpdate'],
      model: { ..._models.get(ALLOWED_COLLS.ORDERS) }
    }
  ],
  [
    '_getMovements',
    {
      name: ALLOWED_COLLS.MOVEMENTS,
      maxLimit: 25,
      dateFieldName: 'mtsUpdated',
      symbolFieldName: 'currency',
      sort: [['mtsUpdated', -1]],
      hasNewData: false,
      start: 0,
      type: 'insertable:array:objects',
      fieldsOfUniqueIndex: ['id', 'mtsUpdated'],
      model: { ..._models.get(ALLOWED_COLLS.MOVEMENTS) }
    }
  ],
  [
    '_getFundingOfferHistory',
    {
      name: ALLOWED_COLLS.FUNDING_OFFER_HISTORY,
      maxLimit: 5000,
      dateFieldName: 'mtsUpdate',
      symbolFieldName: 'symbol',
      sort: [['mtsUpdate', -1]],
      hasNewData: false,
      start: 0,
      type: 'insertable:array:objects',
      fieldsOfUniqueIndex: ['id', 'mtsUpdate'],
      model: { ..._models.get(ALLOWED_COLLS.FUNDING_OFFER_HISTORY) }
    }
  ],
  [
    '_getFundingLoanHistory',
    {
      name: ALLOWED_COLLS.FUNDING_LOAN_HISTORY,
      maxLimit: 5000,
      dateFieldName: 'mtsUpdate',
      symbolFieldName: 'symbol',
      sort: [['mtsUpdate', -1]],
      hasNewData: false,
      start: 0,
      type: 'insertable:array:objects',
      fieldsOfUniqueIndex: ['id', 'mtsUpdate'],
      model: { ..._models.get(ALLOWED_COLLS.FUNDING_LOAN_HISTORY) }
    }
  ],
  [
    '_getFundingCreditHistory',
    {
      name: ALLOWED_COLLS.FUNDING_CREDIT_HISTORY,
      maxLimit: 5000,
      dateFieldName: 'mtsUpdate',
      symbolFieldName: 'symbol',
      sort: [['mtsUpdate', -1]],
      hasNewData: false,
      start: 0,
      type: 'insertable:array:objects',
      fieldsOfUniqueIndex: ['id', 'mtsUpdate'],
      model: { ..._models.get(ALLOWED_COLLS.FUNDING_CREDIT_HISTORY) }
    }
  ],
  [
    '_getSymbols',
    {
      name: ALLOWED_COLLS.SYMBOLS,
      maxLimit: 5000,
      field: 'pairs',
      sort: [['pairs', 1]],
      hasNewData: true,
      type: 'public:updatable:array',
      model: { ..._models.get(ALLOWED_COLLS.SYMBOLS) }
    }
  ],
  [
    '_getCurrencies',
    {
      name: ALLOWED_COLLS.CURRENCIES,
      maxLimit: 5000,
      fields: ['id', 'name', 'pool', 'explorer'],
      sort: [['name', 1]],
      hasNewData: true,
      type: 'public:updatable:array:objects',
      model: { ..._models.get(ALLOWED_COLLS.CURRENCIES) }
    }
  ]
])

const _cloneSchema = (map) => {
  return new Map(Array.from(map).map(item => cloneDeep(item)))
}

const getMethodCollMap = () => {
  return _cloneSchema(_methodCollMap)
}

const getModelsMap = () => {
  return _cloneSchema(_models)
}

module.exports = {
  getMethodCollMap,
  getModelsMap
}
