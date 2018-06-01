'use strict'

const success = (statusCode, responseModel, res) => {
  res.status(statusCode)
  res.json(responseModel)

  return res
}

const failure = (statusCode, errorMessage, res, id = null) => {
  res.status(statusCode)
  res.json({
    error: {
      code: statusCode,
      message: errorMessage
    },
    id
  })

  return res
}

const failureAccessDenied = (res, id = null) => {
  const statusCode = 403
  const errorMessage = 'Access Denied'

  return failure(statusCode, errorMessage, res, id)
}

const failureUnauthorized = (res, id = null) => {
  const statusCode = 401
  const errorMessage = 'Unauthorized'

  return failure(statusCode, errorMessage, res, id)
}

module.exports = {
  success,
  failure,
  failureAccessDenied,
  failureUnauthorized
}
