'use strict'

const headersMiddleware = require('./headers.middleware')
const errorsMiddleware = require('./errors.middleware')
const notFoundMiddleware = require('./not-found.middleware')

module.exports = {
  headersMiddleware,
  errorsMiddleware,
  notFoundMiddleware
}
