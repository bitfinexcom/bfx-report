'use strict'

const {
  grenacheClientService: gClientService,
  helpers
} = require('../services')
const { success } = helpers.responses

const checkAuth = async (req, res) => {
  const id = req.body.id || null
  const query = {
    action: 'getEmail',
    args: [req.body]
  }

  const isSyncMode = await gClientService.request({
    ...query,
    action: 'isSyncModeConfig'
  })

  if (isSyncMode) {
    await gClientService.request({
      ...query,
      action: 'login'
    })

    success(200, { result: true, id }, res)

    return
  }

  const result = await gClientService.request(query)

  if (!result) {
    throw new Error('ERR_AUTH_UNAUTHORIZED')
  }

  success(200, { result: true, id }, res)
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

  const countS3Services = await gClientService.request(queryS3)
  const countSendgridServices = await gClientService.request(querySendgrid)
  let result = false

  if (countS3Services && countSendgridServices) {
    result = await gClientService.request(queryGetEmail)
  }

  success(200, { result, id }, res)
}

const getData = async (req, res) => {
  const body = { ...req.body }
  const id = body.id || null
  delete body.method
  const query = {
    action: req.body.method || '',
    args: [body]
  }

  const result = await gClientService.request(query)

  success(200, { result, id }, res)
}

module.exports = {
  checkAuth,
  checkStoredLocally,
  getData
}
