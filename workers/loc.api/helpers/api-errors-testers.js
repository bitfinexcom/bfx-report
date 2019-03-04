'use strict'

const isAuthError = (err) => {
  return /(missing api key or secret)|(apikey: digest invalid)|(apikey: invalid)|(ERR_AUTH_UNAUTHORIZED)/.test(err.toString())
}

const isEnotfoundError = (err) => {
  return /ENOTFOUND/.test(err.toString())
}

const isEaiAgainError = (err) => {
  return /EAI_AGAIN/.test(err.toString())
}

const isRateLimitError = (err) => {
  return /ERR(_RATE)?_LIMIT/.test(err.toString())
}

const isNonceSmallError = (err) => {
  return /nonce: small/.test(err.toString())
}

module.exports = {
  isAuthError,
  isEnotfoundError,
  isEaiAgainError,
  isRateLimitError,
  isNonceSmallError
}
