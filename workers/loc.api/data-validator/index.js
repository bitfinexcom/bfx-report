'use strict'

const Ajv = require('ajv')
const addFormats = require('ajv-formats')
const argv = require('yargs').argv

const isDevEnv = (
  argv.env === 'development' ||
  process.env.NODE_ENV === 'development'
)

const {
  ArgsParamsError,
  ParamsValidSchemaFindingError
} = require('../errors')

const SCHEMA_DOMAIN = require('./schema.domain')
const SCHEMA_NAMES = require('./schema.names')
const SCHEMA_IDS = require('./schema.ids')
const FILTER_SCHEMA_NAMES = require('./filter.schema.names')
const FILTER_SCHEMA_IDS = require('./filter.schema.ids')
const schemas = require('./schemas')
const filterSchemas = require('./filter-schemas')

const ajv = new Ajv({
  // Compile schema on initialization
  schemas: [
    ...Object.values(schemas),
    ...Object.values(filterSchemas)
  ],

  // Strict mode
  strict: true,
  strictRequired: true,
  allowMatchingProperties: true,
  allowUnionTypes: true,

  $data: true,
  ownProperties: true,
  allErrors: true,
  messages: true,
  formats: { reserved: true },
  verbose: isDevEnv
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

const validate = (args, schemaId, opts) => {
  const {
    shouldParamsFieldBeChecked
  } = opts ?? {}
  const params = args?.params

  if (
    !shouldParamsFieldBeChecked &&
    (
      typeof params === 'undefined' ||
      params === null
    )
  ) {
    return true
  }

  const validate = ajv.getSchema(schemaId)

  if (typeof validate !== 'function') {
    throw new ParamsValidSchemaFindingError()
  }

  const res = validate(params)

  // It covers a case when schema has `$async: true` keyword
  if (res instanceof Promise) {
    return res
      .then(() => true)
      .catch((err) => Promise.reject(
        new ArgsParamsError({ data: err.errors })
      ))
  }

  if (res) {
    return true
  }

  throw new ArgsParamsError({ data: validate.errors })
}

const reinit = (args) => {
  const {
    schemaNames,
    schemaIds,
    filterSchemaNames,
    filterSchemaIds,
    schemas = []
  } = args ?? {}

  Object.assign(SCHEMA_NAMES, schemaNames)
  Object.assign(SCHEMA_IDS, schemaIds)
  Object.assign(FILTER_SCHEMA_NAMES, filterSchemaNames)
  Object.assign(FILTER_SCHEMA_IDS, filterSchemaIds)

  addSchemas(schemas)
}

module.exports = {
  SCHEMA_DOMAIN,
  SCHEMA_NAMES,
  SCHEMA_IDS,
  FILTER_SCHEMA_NAMES,
  FILTER_SCHEMA_IDS,

  reinit,
  addSchemas,
  validate
}
