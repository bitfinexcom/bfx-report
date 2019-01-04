'use strict'

const EventEmitter = require('events')
const { isEmpty } = require('lodash')

const DataInserter = require('../data.inserter')
const {
  setProgress,
  checkCollPermission
} = require('../helpers')
const ALLOWED_COLLS = require('../allowed.colls')

class SyncQueue extends EventEmitter {
  constructor (name) {
    super()

    this.name = name
    this._sort = [['_id', 1]]
  }

  setReportService (reportService) {
    this.reportService = reportService
  }

  setDao (dao) {
    this.dao = dao
  }

  async add (syncColls) {
    const _syncColls = Array.isArray(syncColls)
      ? syncColls
      : [syncColls]
    const mess = checkCollPermission(_syncColls, true)

    if (mess) return mess

    const allSyncs = await this._getAll({ state: 'NEW' })
    const hasALLInDB = allSyncs.some(item => {
      return item.collName === ALLOWED_COLLS.ALL
    })

    if (hasALLInDB) return

    const data = isEmpty(allSyncs)
      ? _syncColls
      : this._getUniqueNames(allSyncs, _syncColls)

    await this.dao.insertElemsToDb(
      this.name,
      null,
      data
    )
  }

  async process () {}

  _getAll (filter) {
    return this.dao.getElemsInCollBy(
      this.name,
      {
        sort: this._sort,
        filter
      }
    )
  }

  _getUniqueNames (allSyncs, syncColls) {
    return syncColls.reduce((accum, curr) => {
      if (
        allSyncs.every(item => item.collName !== curr) &&
        accum.every(item => item !== curr)
      ) {
        accum.push(curr)
      }

      return accum
    }, [])
  }

  async _getNext () {}

  async _remove (id) {}

  async setProgress (progress) {
    await setProgress(this.reportService, progress)

    this.emit('progress', progress)
  }
}

module.exports = SyncQueue
