'use strict'

const Ajv = require('ajv')

const {
  FilterParamsValidSchemaFindingError,
  ArgsParamsFilterError
} = require('../errors')
const _filterModels = require('./filter-models')
const FILTER_MODELS_NAMES = require('./filter.models.names')

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
  const fieldsArrSchema = {
    type: 'array',
    minItems: 1,
    items: {
      type: 'string',
      enum: Object.keys(model)
    }
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
    $nin: arrSchema,
    $isNull: fieldsArrSchema,
    $isNotNull: fieldsArrSchema
  }
  const filterSchema = {
    oneOf: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          $or: {
            type: 'object',
            additionalProperties: false,
            properties: baseProperties
          }
        }
      },
      {
        type: 'object',
        additionalProperties: false,
        properties: baseProperties
      }
    ]
  }

  return filterSchema
}

const _getMethodApiName = (methodApi) => {
  if (methodApi === FILTER_MODELS_NAMES.POSITIONS_AUDIT) {
    return FILTER_MODELS_NAMES.POSITIONS_HISTORY
  }
  if (methodApi === FILTER_MODELS_NAMES.ORDER_TRADES) {
    return FILTER_MODELS_NAMES.TRADES
  }

  return methodApi
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
  const methodName = _getMethodApiName(methodApi)
  const model = _getModel(methodName, filterModels)
  const filterSchema = _getFilterSchema(model)

  if (ajv.validate(filterSchema, filter)) {
    return
  }

  throw new ArgsParamsFilterError(ajv.errors)
}
