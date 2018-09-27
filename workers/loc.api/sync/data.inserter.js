'use strict'

const EventEmitter = require('events')
const _ = require('lodash')

const { collObjToArr, setProgress } = require('./helpers')
const { getMethodCollMap } = require('./schema')

const MESS_ERR_UNAUTH = 'ERR_AUTH_UNAUTHORIZED'

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

  async setProgress (progress) {
    await setProgress(this.reportService, progress)

    this.emit('progress', progress)
  }

  async getAuthFromDb () {
    try {
      const users = await this.dao.getActiveUsers()
      const auth = new Map()

      if (_.isEmpty(users)) {
        return auth
      }

      users.forEach(user => {
        auth.set(
          user.apiKey,
          {
            apiKey: user.apiKey,
            apiSecret: user.apiSecret
          }
        )
      })

      this._auth = auth

      return this._auth
    } catch (err) {
      this._auth = null

      return this._auth
    }
  }

  async insertNewDataToDbMultiUser () {
    await this.getAuthFromDb()

    if (
      !this._auth ||
      !(this._auth instanceof Map) ||
      this._auth.size === 0
    ) {
      await this.setProgress(MESS_ERR_UNAUTH)

      return
    }

    let count = 1

    for (const authItem of this._auth) {
      if (typeof authItem[1] !== 'object') {
        continue
      }

      const userProgress = count / this._auth.size
      await this.insertNewDataToDb(authItem[1], userProgress)
      count += 1
    }
  }

  async insertNewDataToDb (auth, userProgress = 1) {
    if (
      typeof auth.apiKey !== 'string' ||
      typeof auth.apiSecret !== 'string'
    ) {
      await this.setProgress(MESS_ERR_UNAUTH)

      return
    }

    const methodCollMap = await this.checkNewData(auth)
    let count = 0

    for (const [method, item] of methodCollMap) {
      await this._insertApiDataArrObjTypeToDb(auth, method, item)
      await this._insertApiDataArrTypeToDb(auth, method, item)

      count += 1
      const progress = Math.round((count / methodCollMap.size) * 100 * userProgress)
      await this.setProgress(progress)
    }

    await this.setProgress(100)
  }

  async checkNewData (auth) {
    const methodCollMap = this._getMethodCollMap()

    await this._checkNewDataArrObjType(auth, methodCollMap)
    await this._checkNewDataArrType(auth, methodCollMap)

    return new Map([...methodCollMap].filter(([key, value]) => value.hasNewData))
  }

  async _checkNewDataArrObjType (auth, methodCollMap) {
    for (let [method, item] of this._methodCollMap) {
      if (!this._isArrObjTypeOfColl(item)) {
        continue
      }

      const args = this._getMethodArgMap(method, { ...auth }, 1)
      const lastElemFromDb = await this.dao.getLastElemFromDb(
        item.name,
        { ...auth },
        item.dateFieldName
      )
      const lastElemFromApi = await this.reportService[method](args)

      methodCollMap.get(method).hasNewData = false

      if (_.isEmpty(lastElemFromApi)) {
        continue
      }

      if (_.isEmpty(lastElemFromDb)) {
        methodCollMap.get(method).hasNewData = true
        methodCollMap.get(method).start = 0

        continue
      }

      const lastDateInDb = this._compareElemsDbAndApi(
        item.dateFieldName,
        lastElemFromDb,
        lastElemFromApi
      )

      if (lastDateInDb) {
        methodCollMap.get(method).hasNewData = true
        methodCollMap.get(method).start = lastDateInDb + 1
      }
    }

    return methodCollMap
  }

  async _checkNewDataArrType (auth, methodCollMap) {
    for (let [method, item] of this._methodCollMap) {
      if (!this._isArrTypeOfColl(item)) {
        continue
      }

      const {
        diffApiToDb,
        diffDbToApi
      } = await this._getDiffElemsFromApiAndDb(method, item.name, item.field, auth)

      if (
        !_.isEmpty(diffApiToDb) ||
        !_.isEmpty(diffDbToApi)
      ) {
        methodCollMap.get(method).hasNewData = true
      }
    }

    return methodCollMap
  }

  async _getDiffElemsFromApiAndDb (method, collName, fieldName, auth) {
    const args = this._getMethodArgMap(method, { ...auth }, null, null, null)
    const elemsFromApi = await this.reportService[method](args)
    const collElemsFromDb = await this.dao.getElemsInCollBy(collName)
    const elemsFromDb = collObjToArr(collElemsFromDb, fieldName)

    const diffApiToDb = _.difference(elemsFromApi, elemsFromDb)
    const diffDbToApi = _.difference(elemsFromDb, elemsFromApi)

    return {
      diffApiToDb,
      diffDbToApi
    }
  }

  _isArrObjTypeOfColl (coll) {
    return coll.type === 'array:object'
  }

  _isArrTypeOfColl (coll) {
    return coll.type === 'array'
  }

  async _insertApiDataArrObjTypeToDb (
    auth,
    methodApi,
    schema
  ) {
    if (!this._isArrObjTypeOfColl(schema)) {
      return
    }
    if (
      typeof this.reportService[methodApi] !== 'function'
    ) {
      throw new Error('ERR_METHOD_NOT_FOUND')
    }

    const {
      start,
      name: collName,
      dateFieldName,
      model
    } = schema

    const args = this._getMethodArgMap(methodApi, { ...auth }, 10000000, start)
    const _args = _.cloneDeep(args)
    const currIterationArgs = _.cloneDeep(_args)

    let res = null
    let count = 0
    let timeOfPrevIteration = _args.params.end

    while (true) {
      try {
        res = await this.reportService[methodApi](currIterationArgs)
      } catch (err) {
        if (this._isRateLimitError(err)) {
          await this._delay()
          res = await this.reportService[methodApi](currIterationArgs)
        } else throw err
      }

      if (
        !res ||
        !Array.isArray(res) ||
        res.length === 0
      ) break

      const lastItem = res[res.length - 1]

      if (
        typeof lastItem !== 'object' ||
        !lastItem[dateFieldName] ||
        !Number.isInteger(lastItem[dateFieldName])
      ) break

      const currTime = lastItem[dateFieldName]
      let isAllData = false

      if (currTime >= timeOfPrevIteration) {
        break
      }

      if (_args.params.start >= currTime) {
        res = res.filter((item) => _args.params.start <= item[dateFieldName])
        isAllData = true
      }

      if (_args.params.limit < (count + res.length)) {
        res.splice(_args.params.limit - count)
        isAllData = true
      }

      await this.dao.insertElemsToDb(
        collName,
        { ..._args.auth },
        this._normalizeApiData(res, model)
      )

      count += res.length
      const needElems = _args.params.limit - count

      if (isAllData || needElems <= 0) {
        break
      }

      timeOfPrevIteration = currTime
      currIterationArgs.params.end = lastItem[dateFieldName] - 1
      if (needElems) currIterationArgs.params.limit = needElems
    }
  }

  async _insertApiDataArrTypeToDb (
    auth,
    methodApi,
    schema
  ) {
    if (!this._isArrTypeOfColl(schema)) {
      return
    }
    if (
      typeof this.reportService[methodApi] !== 'function'
    ) {
      throw new Error('ERR_METHOD_NOT_FOUND')
    }

    const {
      name: collName,
      field
    } = schema

    const {
      diffApiToDb,
      diffDbToApi
    } = await this._getDiffElemsFromApiAndDb(methodApi, collName, field, auth)

    if (
      Array.isArray(diffDbToApi) &&
      diffDbToApi.length > 0
    ) {
      const dataForRemove = {}
      dataForRemove[field] = diffDbToApi

      await this.dao.removeElemsFromDb(
        collName,
        null,
        dataForRemove
      )
    }

    if (
      Array.isArray(diffApiToDb) &&
      diffApiToDb.length > 0
    ) {
      const res = diffApiToDb.map(item => {
        const obj = {}
        obj[field] = item

        return obj
      })

      await this.dao.insertElemsToDb(
        collName,
        null,
        res
      )
    }
  }

  _compareElemsDbAndApi (dateFieldName, elDb, elApi) {
    const _elDb = Array.isArray(elDb) ? elDb[0] : elDb
    const _elApi = Array.isArray(elApi) ? elApi[0] : elApi

    return _elDb[dateFieldName] < _elApi[dateFieldName] || _elDb[dateFieldName]
  }

  _getMethodArgMap (
    method,
    auth = { apiKey: '', apiSecret: '' },
    limit,
    start = 0,
    end = (new Date()).getTime()
  ) {
    return {
      auth,
      params: {
        limit: limit !== null ? limit : this._methodCollMap.get(method).maxLimit,
        end,
        start
      }
    }
  }

  _getMethodCollMap () {
    return new Map(this._methodCollMap)
  }

  _delay (mc = 80000) {
    return new Promise((resolve) => {
      setTimeout(resolve, mc)
    })
  }

  _isRateLimitError (err) {
    return /ERR_RATE_LIMIT/.test(err.toString())
  }

  _normalizeApiData (data = [], model) {
    return data.map(item => {
      if (
        typeof item !== 'object' ||
        typeof model !== 'object' ||
        Object.keys(model).length === 0
      ) {
        return item
      }

      return _.pick(item, Object.keys(model))
    })
  }
}

module.exports = DataInserter
