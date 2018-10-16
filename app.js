'use strict'

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production'

const express = require('express')
const app = express()
const config = require('config')
const morgan = require('morgan')
const methodOverride = require('method-override')
const bodyParser = require('body-parser')

module.exports = { app }

const {
  headersMiddleware,
  errorsMiddleware,
  notFoundMiddleware
} = require('./src/middlewares')
const {
  corsService,
  logDebugService,
  logService
} = require('./src/services')
const { logger } = logService
const routes = require('./src/routes')

const port = config.get('app.port')
const host = config.get('app.host')

app.use(corsService.corsBase())
app.use(headersMiddleware)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(methodOverride())

if (
  config.has('enableLogDebug') &&
  config.get('enableLogDebug')
) {
  app.use(
    morgan('combined', {
      stream: { write: msg => logDebugService.debug(msg) }
    })
  )
}

app.use('/api/', routes)

app.use(notFoundMiddleware)
app.use(errorsMiddleware)

const server = app.listen(port, host, () => {
  const host = server.address().address
  const port = server.address().port

  logger.info(`Server listening on host ${host} port ${port}`)
  app.emit('listened', server)
})
