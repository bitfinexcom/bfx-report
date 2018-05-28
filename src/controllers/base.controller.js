'use strict'

const { success, failure, failureUnauthorized } = require('../services/helpers/responses');

const checkAuth = (req, res) => {
  // success(200, { success: true }, res)
  failureUnauthorized(res)
}

const getLedgers = (req, res) => {
  success(200, { success: true, data: {} }, res)
  // failure(500, err.toString(), res)
}

module.exports = {
  checkAuth,
  getLedgers
}
