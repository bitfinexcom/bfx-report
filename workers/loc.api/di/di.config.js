'use strict'

const TYPES = require('./types')
const container = require('./index')

module.exports = (conf) => {
  container.bind(TYPES.CONF).toConstantValue(conf)
  container.bind(TYPES.Container).toConstantValue(container)
}
