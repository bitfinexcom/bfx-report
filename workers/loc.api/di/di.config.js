'use strict'

const TYPES = require('./types')
const container = require('./index')

module.exports = (conf, rootFolderPath) => {
  container.bind(TYPES.CONF).toConstantValue(conf)
  container.bind(TYPES.ROOT_FOLDER_PATH).toConstantValue(rootFolderPath)
  container.bind(TYPES.Container).toConstantValue(container)
}
