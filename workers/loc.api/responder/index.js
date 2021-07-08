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

module.exports = (
  container,
  logger
) => (
  handler,
  name,
  done
) => {
  const cb = typeof name === 'function'
    ? name
    : done

  try {
    const resFn = handler(container)

    if (resFn instanceof Promise) {
      if (!cb) {
        return resFn
          .catch((err) => {
            logError(logger, err, name)

            return Promise.reject(err)
          })
      }

      resFn
        .then((res) => cb(null, res))
        .catch((err) => {
          logError(logger, err, name)

          cb(err)
        })

      return
    }

    if (!cb) return resFn
    cb(null, resFn)
  } catch (err) {
    logError(logger, err, name)

    if (cb) cb(err)
    else throw err
  }
}
