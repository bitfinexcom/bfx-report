'use strict'

const { cloneDeep } = require('lodash')
const Ajv = require('ajv')

const schema = require('./schema')

module.exports = (
  args,
  schemaName = 'paramsSchemaForCsv',
  requireFields = [],
  checkParamsField = false,
  additionalSchema = {}
) => {
  const ajv = new Ajv()
  const extendedSchema = { ...schema, ...additionalSchema }

  if (!extendedSchema[schemaName]) {
    throw new Error('ERR_PARAMS_SCHEMA_NOT_FOUND')
  }

  const _schema = cloneDeep(extendedSchema[schemaName])

  if (
    Array.isArray(requireFields) &&
    requireFields.length > 0
  ) {
    if (!args.params) {
      throw new Error('ERR_ARGS_NO_PARAMS')
    }

    if (!Array.isArray(_schema.required)) {
      _schema.required = []
    }

    requireFields.forEach(field => {
      _schema.required.push(field)
    })
  }

  if (
    (checkParamsField || args.params) &&
    !ajv.validate(_schema, args.params)
  ) {
    throw new Error(`ERR_ARGS_NO_PARAMS ${JSON.stringify(ajv.errors)}`)
  }
}
