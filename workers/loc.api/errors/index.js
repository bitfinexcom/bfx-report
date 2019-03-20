'use strict'

class BaseError extends Error {
  constructor (message) {
    super(message)

    this.name = this.constructor.name
    this.message = message

    Error.captureStackTrace(this, this.constructor)
  }
}

class CollSyncPermissionError extends BaseError {
  constructor (message = 'ERR_PERMISSION_DENIED_TO_SYNC_SELECTED_COLL') {
    super(message)
  }
}

class UpdateSyncQueueJobError extends BaseError {
  constructor (id) {
    super(`ERR_CAN_NOT_UPDATE_SYNC_QUEUE_JOB_BY_ID_${id}`)
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

class AsyncProgressHandlerIsNotFnError extends BaseError {
  constructor (message = 'ERR_ASYNC_PROGRESS_HANDLER_IS_NOT_FUNCTION') {
    super(message)
  }
}

class AuthError extends BaseError {
  constructor (message = 'ERR_AUTH_UNAUTHORIZED') {
    super(message)
  }
}

class AfterAllInsertsHookIsNotFnError extends BaseError {
  constructor (message = 'ERR_AFTER_ALL_INSERTS_HOOK_IS_NOT_FUNCTION') {
    super(message)
  }
}

class RemoveListElemsError extends BaseError {
  constructor (message = 'ERR_LIST_IS_NOT_ARRAY') {
    super(message)
  }
}

class UpdateStateCollError extends BaseError {
  constructor (name) {
    super(`ERR_CAN_NOT_UPDATE_STATE_OF_${name.toUpperCase()}`)
  }
}

class UpdateSyncProgressError extends BaseError {
  constructor (name) {
    super(`ERR_CAN_NOT_UPDATE_${name.toUpperCase()}`)
  }
}

class ImplementationError extends BaseError {
  constructor (message = 'ERR_NOT_IMPLEMENTED') {
    super(message)
  }
}

class DAOInitializationError extends BaseError {
  constructor (message = 'ERR_DAO_NOT_INITIALIZED') {
    super(message)
  }
}

class ServerAvailabilityError extends BaseError {
  constructor (restUrl) {
    super(`The server ${restUrl} is not available`)
  }
}

class ArgsParamsError extends BaseError {
  constructor (obj) {
    const str = obj && typeof obj === 'object'
      ? ` ${JSON.stringify(obj)}`
      : ''

    super(`ERR_ARGS_NO_PARAMS${str}`)
  }
}

class GrenacheServiceConfigArgsError extends BaseError {
  constructor (message = 'ERR_CONFIG_ARGS_NO_GRENACHE_SERVICE') {
    super(message)
  }
}

class ObjectMappingError extends BaseError {
  constructor (message = 'ERR_MAPPING_AN_OBJECT_BY_THE_SCHEMA') {
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
  constructor (message = 'ERR_PARAMS_SCHEMA_NOT_FOUND') {
    super(message)
  }
}

class DuringSyncMethodAccessError extends BaseError {
  constructor (message = 'ERR_DURING_SYNC_METHOD_IS_NOT_AVAILABLE') {
    super(message)
  }
}

module.exports = {
  BaseError,
  CollSyncPermissionError,
  UpdateSyncQueueJobError,
  FindMethodError,
  FindMethodToGetCsvFileError,
  AsyncProgressHandlerIsNotFnError,
  AuthError,
  AfterAllInsertsHookIsNotFnError,
  RemoveListElemsError,
  UpdateStateCollError,
  UpdateSyncProgressError,
  ImplementationError,
  DAOInitializationError,
  ServerAvailabilityError,
  ArgsParamsError,
  GrenacheServiceConfigArgsError,
  ObjectMappingError,
  EmailSendingError,
  MinLimitParamError,
  QueueJobAddingError,
  SymbolsTypeError,
  TimeframeError,
  ParamsValidSchemaFindingError,
  DuringSyncMethodAccessError
}
