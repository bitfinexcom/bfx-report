'use strict'

const FILTER_SCHEMA_IDS = require('../filter.schema.ids')
const { getFilterSchema } = require('./helpers')

module.exports = getFilterSchema(
  FILTER_SCHEMA_IDS.GET_FUNDING_OFFER_HISTORY_REQ_FILTER
)
