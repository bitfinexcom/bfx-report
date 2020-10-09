'use strict'

require('reflect-metadata')
const { Container } = require('inversify')

module.exports = new Container({ skipBaseClassChecks: true })
