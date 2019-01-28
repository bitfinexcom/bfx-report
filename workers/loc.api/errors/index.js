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

class FindMethodToGetCsvFileError extends BaseError {
  constructor (message = 'ERR_METHOD_TO_GET_CSV_FILE_NOT_FOUND') {
    super(message)
  }
}

module.exports = {
  BaseError,
  CollSyncPermissionError,
  UpdateSyncQueueJobError,
  FindMethodToGetCsvFileError
}
