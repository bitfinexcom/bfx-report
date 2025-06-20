'use strict'

const SCHEMA_IDS = require('../schema.ids')

module.exports = {
  $id: SCHEMA_IDS.GET_MOVEMENT_INFO_REQ,
  type: 'object',
  additionalProperties: false,
  required: ['id'],
  properties: {
    id: {
      $ref: 'defs#/definitions/intId'
    }
  }
}
