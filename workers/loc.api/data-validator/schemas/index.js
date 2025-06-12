'use strict'

const SCHEMA_NAMES = require('../schema.names')
const { requireSchemas } = require('../helpers')

module.exports = requireSchemas(SCHEMA_NAMES)
