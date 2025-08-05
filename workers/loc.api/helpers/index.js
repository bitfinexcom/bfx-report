'use strict'

const getREST = require('./get-rest')
const {
  prepareResponse,
  prepareApiResponse,
  prepareSymbolResponse
} = require('./prepare-response')
const checkParams = require('./check-params')
const {
  getMethodLimit,
  getReportFileArgs,
  getLimitNotMoreThan
} = require('./limit-param.helpers')
const {
  MIN_START_MTS,
  getDateNotMoreNow,
  getDateNotLessMinStart,
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
  isUserIsNotMerchantError,
  isSymbolInvalidError,
  isENetUnreachError,
  isEConnResetError,
  isETimedOutError,
  isNodeFetchTimeoutError,
  isEAiAgainError,
  isEConnRefusedError,
  isEConnClosedError,
  isENotFoundError,
  isESocketTimeoutError,
  isEHostUnreachError,
  isEProtoError,
  isTempUnavailableError,
  isBadGatewayError,
  isDNSAvailabilityError,
  isSocketHangUpError,
  isCommonNetError,
  isENetError,
  isForbiddenError,
  isMaintenanceError
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
const normalizeFilterParams = require('./normalize-filter-params')
const FILTER_API_METHOD_NAMES = require('./filter.api.method.names')
const FILTER_CONDITIONS = require('./filter.conditions')
const getDataFromApi = require('./get-data-from-api')
const splitSymbolPairs = require('./split-symbol-pairs')
const FOREX_SYMBS = require('./forex.symbs')
const getTranslator = require('./get-translator')

module.exports = {
  getREST,
  getLimitNotMoreThan,
  MIN_START_MTS,
  getDateNotMoreNow,
  getDateNotLessMinStart,
  checkParams,
  hasJobInQueueWithStatusBy,
  isAuthError,
  isRateLimitError,
  isNonceSmallError,
  isUserIsNotMerchantError,
  isSymbolInvalidError,
  isENetUnreachError,
  isEConnResetError,
  isETimedOutError,
  isNodeFetchTimeoutError,
  isEAiAgainError,
  isEConnRefusedError,
  isEConnClosedError,
  isENotFoundError,
  isESocketTimeoutError,
  isEHostUnreachError,
  isEProtoError,
  isTempUnavailableError,
  isBadGatewayError,
  isDNSAvailabilityError,
  isSocketHangUpError,
  isCommonNetError,
  isENetError,
  isForbiddenError,
  isMaintenanceError,
  accountCache,
  parseFields,
  parseLoginsExtraDataFields,
  getTimezoneConf,
  checkTimeLimit,
  prepareResponse,
  prepareApiResponse,
  prepareSymbolResponse,
  getReportFileArgs,
  getMethodLimit,
  checkJobAndGetUserData,
  grcBfxReq,
  filterResponse,
  normalizeFilterParams,
  FILTER_API_METHOD_NAMES,
  FILTER_CONDITIONS,
  getDataFromApi,
  parsePositionsAuditId,
  splitSymbolPairs,
  FOREX_SYMBS,
  getTranslator
}
