'use strict'

const { getErrorArgs } = require('./helpers')

class BaseError extends Error {
  constructor (args) {
    const { message, data } = getErrorArgs(args)

    super(message)

    this.name = this.constructor.name
    this.message = message
    this.statusCode = 500
    this.statusMessage = 'Internal Server Error'
    this.data = data

    Error.captureStackTrace(this, this.constructor)
  }
}

class ImplementationError extends BaseError {
  constructor (message = 'ERR_NOT_IMPLEMENTED') {
    super(message)
  }
}

class BadRequestError extends BaseError {
  constructor (message = 'ERR_BED_REQUEST') {
    super(message)

    this.statusCode = 400
    this.statusMessage = 'Bed request'
  }
}

class AuthError extends BaseError {
  constructor (args) {
    const _args = getErrorArgs(args, 'ERR_AUTH_UNAUTHORIZED')

    super(_args)

    this.statusCode = 401
    this.statusMessage = 'Unauthorized'
  }
}

class ConflictError extends BaseError {
  constructor (message = 'ERR_CONFLICT') {
    super(message)

    this.statusCode = 409
    this.statusMessage = 'Conflict'
  }
}

class UnprocessableEntityError extends BaseError {
  constructor (message = 'ERR_UNPROCESSABLE_ENTITY') {
    super(message)

    this.statusCode = 422
    this.statusMessage = 'Unprocessable Entity'
  }
}

class FindMethodError extends BaseError {
  constructor (message = 'ERR_METHOD_NOT_FOUND') {
    super(message)
  }
}

class FindMethodToGetCsvFileError extends BadRequestError {
  constructor (message = 'ERR_METHOD_TO_GET_CSV_FILE_NOT_FOUND') {
    super(message)

    this.statusMessage = 'Method to get csv file not found'
  }
}

class ArgsParamsError extends BadRequestError {
  constructor (args) {
    const _args = getErrorArgs(args, 'ERR_ARGS_NO_PARAMS')

    super(_args)

    this.statusMessage = 'Args params is not valid'
  }
}

class ArgsParamsFilterError extends ArgsParamsError {
  constructor (args) {
    const _args = getErrorArgs(args, 'ERR_ARGS_PARAMS_FILTER_IS_NOT_VALID')

    super(_args)
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

class MinLimitParamError extends UnprocessableEntityError {
  constructor (message = 'ERR_GREATER_LIMIT_IS_NEEDED') {
    super(message)

    this.statusMessage = 'A greater limit is needed as to show the data correctly'
  }
}

class QueueJobAddingError extends ConflictError {
  constructor (message = 'ERR_HAS_JOB_IN_QUEUE') {
    super(message)

    this.statusMessage = 'Spam restriction mode, user already has an export on queue'
  }
}

class SymbolsTypeError extends UnprocessableEntityError {
  constructor (message = 'ERR_SYMBOLS_ARE_NOT_OF_SAME_TYPE') {
    super(message)

    this.statusMessage = 'Symbols are not of same type'
  }
}

class TimeframeError extends UnprocessableEntityError {
  constructor (message = 'ERR_TIME_FRAME_MORE_THAN_MONTH') {
    super(message)

    this.statusMessage = 'For public trades export please select a time frame smaller than a month'
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

    this.statusMessage = 'Filter by margin and affiliate params may not apply together'
  }
}

class GrcSlackAvailabilityError extends BaseError {
  constructor (message = 'ERR_GRC_SLACK_IS_NOT_AVAILABLE') {
    super(message)
  }
}

module.exports = {
  BaseError,
  BadRequestError,
  AuthError,
  ConflictError,
  UnprocessableEntityError,

  FindMethodError,
  FindMethodToGetCsvFileError,
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
  GrcSlackAvailabilityError,
  ImplementationError
}
