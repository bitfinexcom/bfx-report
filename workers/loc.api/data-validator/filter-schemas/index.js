'use strict'

const FILTER_SCHEMA_NAMES = require('../filter.schema.names')
const { requireSchemas } = require('../helpers')

module.exports = requireSchemas(
  FILTER_SCHEMA_NAMES,
  __dirname
)
