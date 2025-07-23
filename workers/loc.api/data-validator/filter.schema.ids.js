'use strict'

const FILTER_SCHEMA_NAMES = require('./filter.schema.names')
const { getSchemaIds } = require('./helpers')

module.exports = getSchemaIds(FILTER_SCHEMA_NAMES)
