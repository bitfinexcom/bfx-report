'use strict'

const EventEmitter = require('events')
const { isEmpty } = require('lodash')

const DataInserter = require('../data.inserter')
const {
  setProgress,
  checkCollPermission
} = require('../helpers')
const ALLOWED_COLLS = require('../allowed.colls')

const LOCKED_JOB_STATE = 'LOCKED'
const NEW_JOB_STATE = 'NEW'
const FINISHED_JOB_STATE = 'FINISHED'

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
    checkCollPermission(_syncColls)

    const allSyncs = await this._getAll({ state: NEW_JOB_STATE })
    const hasALLInDB = allSyncs.some(item => {
      return item.collName === ALLOWED_COLLS.ALL
    })

    if (hasALLInDB) return

    const uSyncColls = isEmpty(allSyncs)
      ? _syncColls
      : this._getUniqueNames(allSyncs, _syncColls)
    const data = uSyncColls.map(collName => {
      return {
        collName,
        state: NEW_JOB_STATE
      }
    })

    await this.dao.insertElemsToDb(
      this.name,
      null,
      data
    )
  }

  async process () {
    let count = 0

    while (true) {
      count += 1

      const nextSync = await this._getNext()

      if (
        !nextSync ||
        typeof nextSync !== 'object' ||
        count > 100
      ) {
        break
      }

      await this._updateById(
        nextSync._id,
        { state: LOCKED_JOB_STATE }
      )

      const dataInserter = new DataInserter(
        this.reportService,
        nextSync.collName
      )
      dataInserter.setAsyncProgressHandler(progress => {
        return this._asyncProgressHandler(count, progress)
      })

      await dataInserter.insertNewDataToDbMultiUser()
      await this._updateById(
        nextSync._id,
        { state: FINISHED_JOB_STATE }
      )
    }

    await this._removeByState(FINISHED_JOB_STATE)
    await this.setProgress(100)
  }

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

  _getNext () {
    return this.dao.getElemInCollBy(
      this.name,
      { state: [NEW_JOB_STATE, LOCKED_JOB_STATE] },
      this._sort
    )
  }

  _removeByState (state) {
    return this.dao.removeElemsFromDb(
      this.name,
      null,
      { state }
    )
  }

  async _updateById (id, data) {
    const res = await this.dao.updateCollBy(
      this.name,
      { _id: id },
      data
    )

    if (res && res.changes < 1) {
      throw new Error(`ERR_CAN_NOT_UPDATE_${this.name.toUpperCase()}_QUEUE_JOB_BY_ID_${id}`)
    }
  }

  _getCount () {
    return this.dao.getCountBy(this.name)
  }

  async _asyncProgressHandler (count, progress) {
    const syncsAmount = await this._getCount()

    if (count === 0 || progress === 0) {
      return
    }

    const currProgress = Math.round(
      ((count - 1 + (progress / 100)) / syncsAmount) * 100
    )

    await this.setProgress(currProgress)
  }

  async setProgress (progress) {
    await setProgress(this.reportService, progress)

    this.emit('progress', progress)
  }
}

module.exports = SyncQueue
