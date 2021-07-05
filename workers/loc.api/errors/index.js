'use strict'

class BaseError extends Error {
  constructor (message) {
    super(message)

    this.name = this.constructor.name
    this.message = message

    Error.captureStackTrace(this, this.constructor)
  }
}

class FindMethodError extends BaseError {
  constructor (message = 'ERR_METHOD_NOT_FOUND') {
    super(message)
  }
}

class FindMethodToGetCsvFileError extends FindMethodError {
  constructor (message = 'ERR_METHOD_TO_GET_CSV_FILE_NOT_FOUND') {
    super(message)
  }
}

class AuthError extends BaseError {
  constructor (message = 'ERR_AUTH_UNAUTHORIZED') {
    super(message)
  }
}

class ArgsParamsError extends BaseError {
  constructor (obj, message = 'ERR_ARGS_NO_PARAMS') {
    const str = obj && typeof obj === 'object'
      ? ` ${JSON.stringify(obj)}`
      : ''

    super(`${message}${str}`)
  }
}

class ArgsParamsFilterError extends ArgsParamsError {
  constructor (obj) {
    super(obj, 'ERR_ARGS_PARAMS_FILTER_IS_NOT_VALID')
  }
}

class GrenacheServiceConfigArgsError extends BaseError {
  constructor (message = 'ERR_CONFIG_ARGS_NO_GRENACHE_SERVICE') {
    super(message)
  }
}

class EmailSendingError extends BaseError {
  constructor (message = 'ERR_CAN_NOT_SEND_EMAIL') {
    super(message)
  }
}

class MinLimitParamError extends BaseError {
  constructor (message = 'ERR_GREATER_LIMIT_IS_NEEDED') {
    super(message)
  }
}

class QueueJobAddingError extends BaseError {
  constructor (message = 'ERR_HAS_JOB_IN_QUEUE') {
    super(message)
  }
}

class SymbolsTypeError extends BaseError {
  constructor (message = 'ERR_SYMBOLS_ARE_NOT_OF_SAME_TYPE') {
    super(message)
  }
}

class TimeframeError extends BaseError {
  constructor (message = 'ERR_TIME_FRAME_MORE_THAN_MONTH') {
    super(message)
  }
}

class ParamsValidSchemaFindingError extends BaseError {
  constructor (message = 'ERR_PARAMS_SCHEMA_IS_NOT_FOUND') {
    super(message)
  }
}

class FilterParamsValidSchemaFindingError extends ParamsValidSchemaFindingError {
  constructor (message = 'ERR_FILTER_SCHEMA_IS_NOT_FOUND') {
    super(message)
  }
}

class LedgerPaymentFilteringParamsError extends ArgsParamsError {
  constructor (message = 'ERR_FILTER_BY_MARGIN_AND_AFFILIATE_PARAMS_MAY_NOT_APPLY_TOGETHER') {
    super(message)
  }
}

class GrcSlackAvailabilityError extends ArgsParamsError {
  constructor (message = 'ERR_GRC_SLACK_IS_NOT_AVAILABLE') {
    super(message)
  }
}

module.exports = {
  BaseError,
  FindMethodError,
  FindMethodToGetCsvFileError,
  AuthError,
  ArgsParamsError,
  GrenacheServiceConfigArgsError,
  EmailSendingError,
  MinLimitParamError,
  QueueJobAddingError,
  SymbolsTypeError,
  TimeframeError,
  ParamsValidSchemaFindingError,
  FilterParamsValidSchemaFindingError,
  ArgsParamsFilterError,
  LedgerPaymentFilteringParamsError,
  GrcSlackAvailabilityError
}
