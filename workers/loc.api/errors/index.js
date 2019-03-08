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
  ImplementationError
}
