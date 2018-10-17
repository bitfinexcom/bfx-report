'use strict'

const {
  helpers,
  logService
} = require('../services')
const { logger } = logService
const { failure } = helpers.responses

module.exports = (req, res, next) => {
  const id = req.body.id || null

  logger.error('404 Not found')

  failure(
    404,
    'Not found',
    res,
    id
  )
}
