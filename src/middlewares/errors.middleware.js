'use strict'

const {
  helpers,
  logService
} = require('../services')
const { logger } = logService
const { failure } = helpers.responses

const _isAuthError = (err) => {
  return /(apikey: digest invalid)|(apikey: invalid)|(ERR_AUTH_UNAUTHORIZED)|(Cannot read property 'email')/.test(err.toString())
}

const _isHasJobInQueueError = (err) => {
  return /ERR_HAS_JOB_IN_QUEUE/.test(err.toString())
}

const _isNonceSmallError = (err) => {
  return /nonce: small/.test(err.toString())
}

module.exports = (err, req, res, next) => {
  const id = (req.body && req.body.id) || null

  logger.error('Found %s at %s', 'error', err)

  if (_isAuthError(err)) {
    err.statusCode = 401
    err.statusMessage = 'Unauthorized'
  }
  if (_isHasJobInQueueError(err)) {
    err.statusCode = 401
    err.statusMessage = 'Spam restriction mode, user already has an export on queue'
  }
  if (_isNonceSmallError(err)) {
    err.statusMessage = 'Nonces error, key are updated, please get new keys to operate'
  }

  failure(
    err.statusCode ? err.statusCode : 500,
    err.statusMessage ? err.statusMessage : 'Internal Server Error',
    res,
    id
  )
}
