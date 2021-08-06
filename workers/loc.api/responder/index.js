'use strict'

const {
  isAuthError,
  isRateLimitError,
  isNonceSmallError
} = require('../helpers')

const {
  ArgsParamsError,
  ArgsParamsFilterError,
  MinLimitParamError,
  QueueJobAddingError,
  SymbolsTypeError,
  TimeframeError,
  LedgerPaymentFilteringParamsError
} = require('../errors')

const JSON_RPC_VERSION = '2.0'

const _prepareErrorData = (err, name) => {
  const _name = name
    ? `\n  - METHOD_NAME: ${name}`
    : ''
  const _statusCode = err.statusCode
    ? `\n  - STATUS_CODE: ${err.statusCode}`
    : ''
  const _options = err.options
    ? `\n  - OPTION: ${JSON.stringify(err.options)}`
    : ''
  const _err = `\n  - ${err.stack || err}`

  return `${_name}${_statusCode}${_options}${_err}`
}

const logError = (logger, err, name) => {
  if (
    isAuthError(err) ||
    isRateLimitError(err) ||
    isNonceSmallError(err) ||
    err instanceof ArgsParamsError ||
    err instanceof ArgsParamsFilterError ||
    err instanceof MinLimitParamError ||
    err instanceof QueueJobAddingError ||
    err instanceof SymbolsTypeError ||
    err instanceof TimeframeError ||
    err instanceof LedgerPaymentFilteringParamsError
  ) {
    logger.debug(_prepareErrorData(err, name))

    return
  }

  logger.error(_prepareErrorData(err, name))
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
      statusCode: code = 500,
      statusMessage: message = 'Internal Server Error'
    } = result

    return {
      jsonrpc,
      error: { code, message },
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
            logError(logger, err, name)

            return Promise.reject(err)
          })
      }

      resFn
        .then((res) => cb(null, _makeJsonRpcResponse(res)))
        .catch((err) => {
          logError(logger, err, name)

          cb(_makeJsonRpcResponse(err))
        })

      return
    }

    if (!cb) return resFn
    cb(null, _makeJsonRpcResponse(resFn))
  } catch (err) {
    logError(logger, err, name)

    if (!cb) throw err
    cb(_makeJsonRpcResponse(err))
  }
}
