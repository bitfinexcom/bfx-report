'use strict'

const {
  grenacheClientService: gClientService,
  helpers
} = require('../services')
const { success, failureInternalServerError, failureUnauthorized } = helpers.responses

const _isAuthError = (err) => {
  return /apikey: digest invalid/.test(err.toString())
}

const checkAuth = async (req, res) => {
  const id = req.body.id || null
  const query = {
    action: 'fundingInfo',
    args: [req.body]
  }

  try {
    await gClientService.request(query)

    success(200, { result: true, id }, res)
  } catch (err) {
    if (_isAuthError(err)) {
      failureUnauthorized(res, id)

      return
    }

    failureInternalServerError(res, id)
  }
}

const getData = async (req, res) => {
  const body = { ...req.body }
  const id = body.id || null
  delete body.method
  const query = {
    action: req.body.method || '',
    args: [body]
  }

  try {
    const result = await gClientService.request(query)

    success(200, { result, id }, res)
  } catch (err) {
    if (_isAuthError(err)) {
      failureUnauthorized(res, id)

      return
    }

    failureInternalServerError(res, id)
  }
}

module.exports = {
  checkAuth,
  getData
}
