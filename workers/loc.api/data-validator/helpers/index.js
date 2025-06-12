'use strict'

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

module.exports = {
  getSchemaIds
}
