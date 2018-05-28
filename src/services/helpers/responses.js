'use strict'

const success = function(statusCode, responseModel, res) {
  res.status(statusCode)
  res.json(responseModel)

  return res
}

const failure = function(statusCode, errorMessage, res) {
  res.status(statusCode)
  res.json({
    message: errorMessage,
    success: false
  })

  return res
}

const failureAccessDenied = function(res) {
  const statusCode = 403;
  const errorMessage = 'Access Denied';

  return failure(statusCode, errorMessage, res);
};

const failureUnauthorized = function(res) {
  const statusCode = 401;
  const errorMessage = 'Unauthorized';

  return failure(statusCode, errorMessage, res);
};

module.exports = {
  success,
  failure,
  failureAccessDenied,
  failureUnauthorized
}
