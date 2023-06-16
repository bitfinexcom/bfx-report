'use strict'

const _getErrorString = (err) => {
  const response = err?.response
    ? ` ${err.response}`
    : ''
  return `${err.toString()}${response}`
}

const isAuthError = (err) => {
  return /(token: invalid)|(missing api key or secret)|(apikey: digest invalid)|(apikey: invalid)|(ERR_AUTH_UNAUTHORIZED)/.test(_getErrorString(err))
}

const isRateLimitError = (err) => {
  return /(ERR(_RATE)?_LIMIT)|(ratelimit)/.test(_getErrorString(err))
}

const isNonceSmallError = (err) => {
  return /nonce: small/.test(_getErrorString(err))
}

const isUserIsNotMerchantError = (err) => {
  return /ERR_INVOICE_LIST: ERR_PAY_USER_NOT_MERCHANT/.test(_getErrorString(err))
}

const isSymbolInvalidError = (err) => {
  return /(symbol: invalid)|(currency: invalid)/.test(_getErrorString(err))
}

const isENetUnreachError = (err) => {
  return /ENETUNREACH/.test(_getErrorString(err))
}

const isEConnResetError = (err) => {
  return /ECONNRESET/.test(_getErrorString(err))
}

const isETimedOutError = (err) => {
  return /ETIMEDOUT/.test(_getErrorString(err))
}

const isEAiAgainError = (err) => {
  return /EAI_AGAIN/.test(_getErrorString(err))
}

const isEConnRefusedError = (err) => {
  return /ECONNREFUSED/.test(_getErrorString(err))
}

const isENotFoundError = (err) => {
  return /ENOTFOUND/.test(_getErrorString(err))
}

const isESocketTimeoutError = (err) => {
  return /ESOCKETTIMEDOUT/.test(_getErrorString(err))
}

const isEHostUnreachError = (err) => {
  return /EHOSTUNREACH/.test(_getErrorString(err))
}

const isEProtoError = (err) => {
  return /EPROTO/.test(_getErrorString(err))
}

const isTempUnavailableError = (err) => {
  return /temporarily_unavailable/.test(_getErrorString(err))
}

const isENetError = (err) => (
  isENetUnreachError(err) ||
  isEConnResetError(err) ||
  isETimedOutError(err) ||
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
  isEAiAgainError,
  isEConnRefusedError,
  isENotFoundError,
  isESocketTimeoutError,
  isEHostUnreachError,
  isEProtoError,
  isTempUnavailableError,
  isENetError
}
