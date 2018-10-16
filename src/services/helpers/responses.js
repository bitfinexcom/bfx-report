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

module.exports = {
  success,
  failure
}
