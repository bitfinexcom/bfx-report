'use strict'

const getREST = require('./get-rest')
const {
  prepareResponse,
  prepareApiResponse
} = require('./prepare-response')
const checkParams = require('./check-params')
const {
  getMethodLimit,
  getCsvArgs,
  getLimitNotMoreThan
} = require('./limit-param.helpers')
const {
  getDateNotMoreNow,
  checkTimeLimit
} = require('./date-param.helpers')
const getTimezoneConf = require('./get-timezone-conf')
const hasJobInQueueWithStatusBy = require(
  './has-job-in-queue-with-status-by'
)
const {
  isAuthError,
  isRateLimitError,
  isNonceSmallError,
  isUserIsNotMerchantError
} = require('./api-errors-testers')
const {
  accountCache,
  parseFields,
  parseLoginsExtraDataFields,
  parsePositionsAuditId
} = require('./utils')
const checkJobAndGetUserData = require(
  './check-job-and-get-user-data'
)
const grcBfxReq = require('./grc-bfx-req')
const filterResponse = require('./filter-response')
const filterModels = require('./filter-models')
const checkFilterParams = require('./check-filter-params')
const normalizeFilterParams = require('./normalize-filter-params')
const FILTER_MODELS_NAMES = require('./filter.models.names')
const FILTER_CONDITIONS = require('./filter.conditions')
const getDataFromApi = require('./get-data-from-api')
const splitSymbolPairs = require('./split-symbol-pairs')

module.exports = {
  getREST,
  getLimitNotMoreThan,
  getDateNotMoreNow,
  checkParams,
  hasJobInQueueWithStatusBy,
  isAuthError,
  isRateLimitError,
  isNonceSmallError,
  isUserIsNotMerchantError,
  accountCache,
  parseFields,
  parseLoginsExtraDataFields,
  getTimezoneConf,
  checkTimeLimit,
  prepareResponse,
  prepareApiResponse,
  getCsvArgs,
  getMethodLimit,
  checkJobAndGetUserData,
  grcBfxReq,
  filterResponse,
  filterModels,
  checkFilterParams,
  normalizeFilterParams,
  FILTER_MODELS_NAMES,
  FILTER_CONDITIONS,
  getDataFromApi,
  parsePositionsAuditId,
  splitSymbolPairs
}
