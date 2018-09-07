'use strict'

const {
  grenacheClientService: gClientService,
  helpers
} = require('../services')
const {
  success,
  failureInternalServerError,
  failureUnauthorized,
  failureHasJobInQueue
} = helpers.responses

const _isAuthError = (err) => {
  return /(apikey: digest invalid)|(ERR_AUTH_UNAUTHORIZED)|(Cannot read property 'email')/.test(err.toString())
}

const _isHasJobInQueueError = (err) => {
  return /ERR_HAS_JOB_IN_QUEUE/.test(err.toString())
}

const checkAuth = async (req, res) => {
  const id = req.body.id || null
  const query = {
    action: 'getEmail',
    args: [req.body]
  }

  try {
    const result = await gClientService.request(query)

    if (!result) {
      throw new Error('ERR_AUTH_UNAUTHORIZED')
    }

    success(200, { result: true, id }, res)
  } catch (err) {
    if (_isAuthError(err)) {
      failureUnauthorized(res, id)

      return
    }

    failureInternalServerError(res, id)
  }
}

const checkStoredLocally = async (req, res) => {
  const id = req.body.id || null
  const queryS3 = {
    action: 'lookUpFunction',
    args: [{
      params: { service: 'rest:ext:s3' }
    }]
  }
  const querySendgrid = {
    action: 'lookUpFunction',
    args: [{
      params: { service: 'rest:ext:sendgrid' }
    }]
  }
  const queryGetEmail = {
    action: 'getEmail',
    args: [req.body]
  }

  try {
    const countS3Services = await gClientService.request(queryS3)
    const countSendgridServices = await gClientService.request(querySendgrid)
    let result = false

    if (countS3Services && countSendgridServices) {
      result = await gClientService.request(queryGetEmail)
    }

    success(200, { result, id }, res)
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
    if (_isHasJobInQueueError(err)) {
      failureHasJobInQueue(res, id)

      return
    }

    failureInternalServerError(res, id)
  }
}

module.exports = {
  checkAuth,
  checkStoredLocally,
  getData
}
