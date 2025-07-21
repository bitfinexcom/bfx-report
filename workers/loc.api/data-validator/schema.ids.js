'use strict'

const SCHEMA_NAMES = require('./schema.names')
const { getSchemaIds } = require('./helpers')

module.exports = getSchemaIds(SCHEMA_NAMES)
