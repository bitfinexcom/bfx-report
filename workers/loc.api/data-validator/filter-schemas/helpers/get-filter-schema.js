'use strict'

const {
  FilterParamsValidSchemaFindingError
} = require('../../../errors')
const FILTER_CONDITIONS = require('../../../helpers/filter.conditions')
const _filterModels = require('./filter-models')

const getFilterModel = (
  filterSchemaId,
  filterModels = _filterModels
) => {
  if (
    !filterSchemaId ||
    typeof filterSchemaId !== 'string' ||
    !filterModels.has(filterSchemaId)
  ) {
    throw new FilterParamsValidSchemaFindingError()
  }

  return filterModels.get(filterSchemaId)
}

module.exports = (
  filterSchemaId,
  filterModels = _filterModels
) => {
  const model = getFilterModel(filterSchemaId, filterModels)

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
    [FILTER_CONDITIONS.GT]: objSchema,
    [FILTER_CONDITIONS.GTE]: objSchema,
    [FILTER_CONDITIONS.LT]: objSchema,
    [FILTER_CONDITIONS.LTE]: objSchema,
    [FILTER_CONDITIONS.NOT]: objSchema,
    [FILTER_CONDITIONS.LIKE]: objSchema,
    [FILTER_CONDITIONS.EQ]: objSchema,
    [FILTER_CONDITIONS.NE]: objSchema,
    [FILTER_CONDITIONS.IN]: arrSchema,
    [FILTER_CONDITIONS.NIN]: arrSchema,
    [FILTER_CONDITIONS.IS_NULL]: fieldsArrSchema,
    [FILTER_CONDITIONS.IS_NOT_NULL]: fieldsArrSchema
  }
  const filterSchema = {
    $id: filterSchemaId,
    oneOf: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          [FILTER_CONDITIONS.OR]: {
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
