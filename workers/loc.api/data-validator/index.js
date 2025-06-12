'use strict'

const Ajv = require('ajv')
const addFormats = require('ajv-formats')

const SCHEMA_DOMAIN = require('./schema.domain')
const SCHEMA_NAMES = require('./schema.names')
const SCHEMA_IDS = require('./schema.ids')
const schemas = require('./schemas')

const ajv = new Ajv({
  schemas: Object.values(schemas),

  // strict mode
  strict: true,
  strictRequired: true,
  allowMatchingProperties: true,
  allowUnionTypes: true,

  $data: true,
  ownProperties: true,
  allErrors: true,
  messages: true,
  formats: { reserved: true },
  verbose: false
})
addFormats(ajv)

const addSchemas = (schemas = []) => {
  const _schemas = Array.isArray(schemas)
    ? schemas
    : [schemas]

  if (_schemas.length === 0) {
    return
  }

  for (const schema of schemas) {
    ajv.addSchema(schema)
  }
}

// TODO:
const validate = () => {}

module.exports = {
  SCHEMA_DOMAIN,
  SCHEMA_NAMES,
  SCHEMA_IDS,

  addSchemas,
  validate
}
