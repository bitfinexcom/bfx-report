'use strict'

const SCHEMA_DOMAIN = require('./schema.domain')
const SCHEMA_NAMES = require('./schema.names')

const SCHEMA_IDS = {}

for (const [key, name] of Object.entries(SCHEMA_NAMES)) {
  SCHEMA_IDS[key] = `${SCHEMA_DOMAIN}/${name}`
}

module.exports = SCHEMA_IDS
