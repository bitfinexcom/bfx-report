'use strict'

const isAuthError = (err) => {
  return /(missing api key or secret)|(apikey: digest invalid)|(apikey: invalid)|(ERR_AUTH_UNAUTHORIZED)/.test(err.toString())
}

const isRateLimitError = (err) => {
  return /(ERR(_RATE)?_LIMIT)|(ratelimit)/.test(err.toString())
}

const isNonceSmallError = (err) => {
  return /nonce: small/.test(err.toString())
}

module.exports = {
  isAuthError,
  isRateLimitError,
  isNonceSmallError
}
