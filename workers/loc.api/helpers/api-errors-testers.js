'use strict'

const _getErrorString = (err) => {
  const response = err?.response
    ? ` ${err.response}`
    : ''
  return `${err.toString()}${response}`
}

const isAuthError = (err) => {
  return /(token: invalid)|(missing api key or secret)|(apikey: digest invalid)|(apikey: invalid)|(ERR_AUTH_UNAUTHORIZED)|(ERR_AUTH_API: ERR_INVALID_CREDENTIALS)/i.test(_getErrorString(err))
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
  return /network timeout/i.test(_getErrorString(err))
}

const isEAiAgainError = (err) => {
  return /EAI_AGAIN/i.test(_getErrorString(err))
}

const isEConnRefusedError = (err) => {
  return /ECONNREFUSED/i.test(_getErrorString(err))
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

const isForbiddenError = (err) => {
  return /forbidden/i.test(_getErrorString(err))
}

const isENetError = (err) => (
  isENetUnreachError(err) ||
  isEConnResetError(err) ||
  isETimedOutError(err) ||
  isNodeFetchTimeoutError(err) ||
  isEAiAgainError(err) ||
  isEConnRefusedError(err) ||
  isENotFoundError(err) ||
  isESocketTimeoutError(err) ||
  isEHostUnreachError(err) ||
  isEProtoError(err) ||
  isTempUnavailableError(err)
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
  isENotFoundError,
  isESocketTimeoutError,
  isEHostUnreachError,
  isEProtoError,
  isTempUnavailableError,
  isENetError,
  isForbiddenError
}
