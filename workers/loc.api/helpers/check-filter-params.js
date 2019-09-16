'use strict'

const Ajv = require('ajv')

const {
  FilterParamsValidSchemaFindingError,
  ArgsParamsFilterError
} = require('../errors')
const _filterModels = require('./filter-models')

const _getModel = (
  name,
  filterModels = _filterModels
) => {
  if (
    !name ||
    typeof name !== 'string' ||
    !filterModels.has(name)
  ) {
    throw new FilterParamsValidSchemaFindingError()
  }

  return { ...filterModels.get(name) }
}

const _getFilterSchema = (model = {}) => {
  if (
    !model ||
    typeof model !== 'object' ||
    Object.keys(model).length === 0
  ) {
    throw new FilterParamsValidSchemaFindingError()
  }

  const properties = { ...model }
  const objSchema = {
    type: 'object',
    additionalProperties: false,
    properties
  }
  const arrSchema = {
    type: 'object',
    additionalProperties: false,
    properties: Object.entries(model).reduce((accum, [key, item]) => {
      return {
        ...accum,
        [key]: {
          type: 'array',
          minItems: 1,
          items: { ...item }
        }
      }
    }, {})
  }

  const baseProperties = {
    $gt: objSchema,
    $gte: objSchema,
    $lt: objSchema,
    $lte: objSchema,
    $not: objSchema,
    $like: objSchema,
    $eq: objSchema,
    $ne: objSchema,
    $in: arrSchema,
    $nin: arrSchema
  }
  const filterSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      ...baseProperties,
      $or: {
        type: 'object',
        additionalProperties: false,
        properties: baseProperties
      }
    }
  }

  return filterSchema
}

module.exports = (
  methodApi,
  args = {},
  filterModels
) => {
  const { params } = { ...args }
  const { filter } = { ...params }

  if (
    !filter ||
    typeof filter !== 'object' ||
    Object.keys(filter).length === 0
  ) {
    return
  }

  const ajv = new Ajv()
  const model = _getModel(methodApi, filterModels)
  const filterSchema = _getFilterSchema(model)

  if (ajv.validate(filterSchema, filter)) {
    return
  }

  throw new ArgsParamsFilterError(ajv.errors)
}
