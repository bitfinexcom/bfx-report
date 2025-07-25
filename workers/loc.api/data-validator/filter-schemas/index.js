'use strict'

const path = require('node:path')

const FILTER_SCHEMA_NAMES = require('../filter.schema.names')
const { requireSchemas } = require('../helpers')

module.exports = requireSchemas(
  FILTER_SCHEMA_NAMES,
  path.join(__dirname, '../filter-schemas')
)
