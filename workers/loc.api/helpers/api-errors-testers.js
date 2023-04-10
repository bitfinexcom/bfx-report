'use strict'

const isAuthError = (err) => {
  return /(token: invalid)|(missing api key or secret)|(apikey: digest invalid)|(apikey: invalid)|(ERR_AUTH_UNAUTHORIZED)/.test(err.toString())
}

const isRateLimitError = (err) => {
  return /(ERR(_RATE)?_LIMIT)|(ratelimit)/.test(err.toString())
}

const isNonceSmallError = (err) => {
  return /nonce: small/.test(err.toString())
}

const isUserIsNotMerchantError = (err) => {
  return /ERR_INVOICE_LIST: ERR_PAY_USER_NOT_MERCHANT/.test(err.toString())
}

const isSymbolInvalidError = (err) => {
  return /(symbol: invalid)|(currency: invalid)/.test(err.toString())
}

const isENetUnreachError = (err) => {
  return /ENETUNREACH/.test(err.toString())
}

const isEConnResetError = (err) => {
  return /ECONNRESET/.test(err.toString())
}

const isETimedOutError = (err) => {
  return /ETIMEDOUT/.test(err.toString())
}

const isEAiAgainError = (err) => {
  return /EAI_AGAIN/.test(err.toString())
}

const isEConnRefusedError = (err) => {
  return /ECONNREFUSED/.test(err.toString())
}

const isENotFoundError = (err) => {
  return /ENOTFOUND/.test(err.toString())
}

const isESocketTimeoutError = (err) => {
  return /ESOCKETTIMEDOUT/.test(err.toString())
}

const isEHostUnreachError = (err) => {
  return /EHOSTUNREACH/.test(err.toString())
}

const isEProtoError = (err) => {
  return /EPROTO/.test(err.toString())
}

const isTempUnavailableError = (err) => {
  return /temporarily_unavailable/.test(err.toString())
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
