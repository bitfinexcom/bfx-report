'use strict'

const path = require('node:path')

const SCHEMA_NAMES = require('../schema.names')

const schemas = {}

for (const name of Object.values(SCHEMA_NAMES)) {
  schemas[name] = require(path.join(__dirname, name))
}

module.exports = schemas
