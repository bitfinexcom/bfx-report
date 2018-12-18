'use strict'

const accessors = {
  publicСollsСonfAccessors: require('./public-colls-conf.accessors')
}

module.exports = {
  ...accessors,
  setDao (dao) {
    Object.values(accessors).forEach(acc => acc.setDao(dao))
  }
}
