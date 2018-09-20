'use strict'

const EventEmitter = require('events')

const { getMethodCollMap } = require('./schema')

class DataInserter extends EventEmitter {
  constructor (reportService, methodCollMap) {
    super()

    this.reportService = reportService
    this.dao = this.reportService.dao
    this._methodCollMap = (methodCollMap instanceof Map)
      ? new Map(methodCollMap)
      : getMethodCollMap()
    this._auth = null
  }

  async insertNewDataToDbMultiUser () {}
}

module.exports = DataInserter
