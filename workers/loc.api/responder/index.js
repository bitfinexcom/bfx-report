'use strict'

const {
  isAuthError,
  isRateLimitError,
  isNonceSmallError,
  isUserIsNotMerchantError,
  isSymbolInvalidError
} = require('../helpers')

const {
  BaseError
} = require('../errors')

const JSON_RPC_VERSION = '2.0'

const _prepareErrorData = (err, name) => {
  const { message = 'ERR_ERROR_HAS_OCCURRED' } = err
  const _name = name
    ? `\n  - METHOD_NAME: ${name}`
    : ''
  const _statusCode = err.statusCode
    ? `\n  - STATUS_CODE: ${err.statusCode}`
    : ''
  const _statusMessage = err.statusMessage
    ? `\n  - STATUS_MESSAGE: ${err.statusMessage}`
    : ''
  const _data = err.data
    ? `\n  - DATA: ${JSON.stringify(err.data)}`
    : ''
  const stackTrace = (err.stack || err)
    ? `\n  - STACK_TRACE ${err.stack || err}`
    : ''

  return `\
    ${message}\
    ${_name}\
    ${_statusCode}\
    ${_statusMessage}\
    ${_data}\
    ${stackTrace}`
}

const _getErrorWithMetadataForNonBaseError = (args, err) => {
  if (
    !err ||
    typeof err !== 'object'
  ) {
    return typeof err === 'string'
      ? new BaseError(err)
      : new BaseError()
  }
  if (err instanceof BaseError) {
    return err
  }
  if (isAuthError(err)) {
    err.statusCode = 401
    err.statusMessage = 'Unauthorized'

    return err
  }
  if (isRateLimitError(err)) {
    err.statusCode = 409
    err.statusMessage = 'Rate limit error'

    return err
  }
  if (isNonceSmallError(err)) {
    err.statusCode = 409
    err.statusMessage = 'Nonces error, key are updated, please get new keys to operate'

    return err
  }
  if (isUserIsNotMerchantError(err)) {
    err.statusCode = 409
    err.statusMessage = 'Pay invoice list error, the user is not a merchant'

    return err
  }
  if (isSymbolInvalidError(err)) {
    const _symbol = args?.params?.symbol ?? 'selected currency'
    const symbol = Array.isArray(_symbol)
      ? _symbol.toString()
      : _symbol

    err.message = err.message.replace(']', `,"${symbol}"]`)
    err.statusCode = 500
    err.statusMessage = `Invalid symbol error, '${symbol}' is not supported`
    err.data = [{ symbol }]

    return err
  }

  return err
}

const _getErrorMetadata = (args, err) => {
  const errWithMetadata = _getErrorWithMetadataForNonBaseError(args, err)
  const {
    statusCode: code = 500,
    statusMessage: message = 'Internal Server Error',
    data = null
  } = errWithMetadata

  const error = Object.assign(
    errWithMetadata,
    {
      statusCode: code,
      statusMessage: message,
      data
    }
  )

  return { code, message, data, error }
}

const _logError = (logger, args, err, name) => {
  const {
    code,
    error
  } = _getErrorMetadata(args, err)

  if (code !== 500) {
    logger.debug(_prepareErrorData(error, name))

    return
  }

  logger.error(_prepareErrorData(error, name))
}

/*
 * JSON-RPC specification:
 * https://www.jsonrpc.org/specification
 */
const _makeJsonRpcResponse = (args, result) => {
  const jsonrpc = JSON_RPC_VERSION
  const _args = (
    args &&
    typeof args === 'object'
  )
    ? args
    : {}
  const { id = null } = _args

  if (result instanceof Error) {
    const {
      code,
      message,
      data
    } = _getErrorMetadata(args, result)

    return {
      jsonrpc,
      error: { code, message, data },
      id
    }
  }

  return { jsonrpc, result, id }
}

/*
 * If callback is passed it means that
 * uses grenache network with JSON-RPC response
 *
 * If cb isn't passed returns a typical response
 * to be able to use with the internal logic
 */
module.exports = (
  container,
  logger
) => (
  handler,
  name,
  args,
  cb
) => {
  try {
    const resFn = handler(container, args)

    if (resFn instanceof Promise) {
      if (!cb) {
        return resFn
          .catch((err) => {
            _logError(logger, args, err, name)

            return Promise.reject(err)
          })
      }

      resFn
        .then((res) => cb(null, _makeJsonRpcResponse(args, res)))
        .catch((err) => {
          _logError(logger, args, err, name)

          cb(null, _makeJsonRpcResponse(args, err))
        })

      return
    }

    if (!cb) return resFn
    cb(null, _makeJsonRpcResponse(args, resFn))
  } catch (err) {
    _logError(logger, args, err, name)

    if (!cb) throw err
    cb(null, _makeJsonRpcResponse(args, err))
  }
}
