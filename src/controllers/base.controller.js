'use strict'

const {
  grenacheClientService: gClientService,
  helpers
} = require('../services')
const { success, failure, failureUnauthorized } = helpers.responses

const checkAuth = async (req, res) => {
  const query = {
    action: 'fundingInfo',
    args: [req.body]
  }

  try {
    const data = await gClientService.request(query)

    success(200, { success: true }, res)
  } catch (err) {
    failureUnauthorized(res)
  }
}

const getData = async (req, res) => {
  const body = { ...req.body }
  delete body.method
  
  const query = {
    action: req.body.method || '',
    args: [body]
  }

  try {
    const data = await gClientService.request(query)

    success(200, { success: true, data }, res)
  } catch (err) {
    failure(500, err.toString(), res)
  }
}

module.exports = {
  checkAuth,
  getData
}
