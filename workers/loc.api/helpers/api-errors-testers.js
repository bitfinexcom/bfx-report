'use strict'

const _getErrorString = (err) => {
  const response = err?.response
    ? ` ${err.response}`
    : ''
  return `${err.toString()}${response}`
}

const isAuthError = (err) => {
  return /(token: invalid)|(missing api key or secret)|(apikey: digest invalid)|(apikey: invalid)|(ERR_AUTH_UNAUTHORIZED)|(ERR_AUTH_API)/i.test(_getErrorString(err))
}

const isRateLimitError = (err) => {
  return /(ERR(_RATE)?_LIMIT)|(ratelimit)/i.test(_getErrorString(err))
}

const isNonceSmallError = (err) => {
  return /nonce: small/i.test(_getErrorString(err))
}

const isUserIsNotMerchantError = (err) => {
  return /ERR_INVOICE_LIST: ERR_PAY_USER_NOT_MERCHANT/i.test(_getErrorString(err))
}

const isSymbolInvalidError = (err) => {
  return /(symbol: invalid)|(currency: invalid)/i.test(_getErrorString(err))
}

const isENetUnreachError = (err) => {
  return /ENETUNREACH/i.test(_getErrorString(err))
}

const isEConnResetError = (err) => {
  return /ECONNRESET/i.test(_getErrorString(err))
}

const isETimedOutError = (err) => {
  return /ETIMEDOUT/i.test(_getErrorString(err))
}

const isNodeFetchTimeoutError = (err) => {
  return /timeout/i.test(_getErrorString(err))
}

const isEAiAgainError = (err) => {
  return /EAI_AGAIN/i.test(_getErrorString(err))
}

const isEConnRefusedError = (err) => {
  return /(ECONNREFUSED)|(ERR_CONNECTION_REFUSED)/i.test(_getErrorString(err))
}

const isEConnClosedError = (err) => {
  return /ERR_CONNECTION_CLOSED/i.test(_getErrorString(err))
}

const isENotFoundError = (err) => {
  return /ENOTFOUND/i.test(_getErrorString(err))
}

const isESocketTimeoutError = (err) => {
  return /ESOCKETTIMEDOUT/i.test(_getErrorString(err))
}

const isEHostUnreachError = (err) => {
  return /EHOSTUNREACH/i.test(_getErrorString(err))
}

const isEProtoError = (err) => {
  return /EPROTO/i.test(_getErrorString(err))
}

const isTempUnavailableError = (err) => {
  return /temporarily_unavailable/i.test(_getErrorString(err))
}

const isBadGatewayError = (err) => {
  return /Bad Gateway/i.test(_getErrorString(err))
}

const isDNSAvailabilityError = (err) => {
  return /ERR_NAME_NOT_RESOLVED/i.test(_getErrorString(err))
}

const isSocketHangUpError = (err) => {
  return /socket hang up/i.test(_getErrorString(err))
}

const isCommonNetError = (err) => {
  return /net::ERR_/i.test(_getErrorString(err))
}

const isForbiddenError = (err) => {
  return /forbidden/i.test(_getErrorString(err))
}

// https://docs.bitfinex.com/docs/rest-general
const isMaintenanceError = (err) => {
  return /maintenance/i.test(_getErrorString(err))
}

const isENetError = (err) => (
  isENetUnreachError(err) ||
  isEConnResetError(err) ||
  isETimedOutError(err) ||
  isNodeFetchTimeoutError(err) ||
  isEAiAgainError(err) ||
  isEConnRefusedError(err) ||
  isEConnClosedError(err) ||
  isENotFoundError(err) ||
  isESocketTimeoutError(err) ||
  isEHostUnreachError(err) ||
  isEProtoError(err) ||
  isTempUnavailableError(err) ||
  isBadGatewayError(err) ||
  isDNSAvailabilityError(err) ||
  isSocketHangUpError(err) ||
  isCommonNetError(err)
)

module.exports = {
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
}
