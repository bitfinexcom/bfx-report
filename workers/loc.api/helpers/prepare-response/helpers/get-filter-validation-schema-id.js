'use strict'

const FILTER_API_METHOD_NAMES = require('../../filter.api.method.names')
const { FILTER_SCHEMA_IDS } = require('../../../data-validator')

const PARAMS_SCHEMAS_MAP = {
  [FILTER_API_METHOD_NAMES.POSITIONS_HISTORY]: FILTER_SCHEMA_IDS
    .GET_POSITIONS_HISTORY_REQ_FILTER
}

module.exports = (
  method,
  map = PARAMS_SCHEMAS_MAP
) => {
  return map?.[method]
}
