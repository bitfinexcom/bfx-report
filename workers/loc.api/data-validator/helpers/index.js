'use strict'

const path = require('node:path')

const SCHEMA_DOMAIN = require('../schema.domain')

const getSchemaIds = (schemaNames, schemaDomain) => {
  const domain = schemaDomain ?? SCHEMA_DOMAIN
  const names = Object.entries(schemaNames ?? {})

  const schemaIds = {}

  for (const [key, name] of names) {
    schemaIds[key] = `${domain}/${name}`
  }

  return schemaIds
}

const requireSchemas = (schemaNames, baseSchemaPath) => {
  const schemaPath = baseSchemaPath ?? path.join(__dirname, '../schemas')
  const names = Object.values(schemaNames ?? {})

  const schemas = {}

  for (const name of names) {
    schemas[name] = require(path.join(schemaPath, name))
  }

  return schemas
}

module.exports = {
  getSchemaIds,
  requireSchemas
}
