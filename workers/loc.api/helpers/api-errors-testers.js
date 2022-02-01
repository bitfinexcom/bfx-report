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

module.exports = {
  isAuthError,
  isRateLimitError,
  isNonceSmallError,
  isUserIsNotMerchantError,
  isSymbolInvalidError,
  isENetUnreachError
}
