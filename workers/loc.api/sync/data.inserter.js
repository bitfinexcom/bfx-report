'use strict'

const EventEmitter = require('events')
const _ = require('lodash')

const { setProgress, delay } = require('./helpers')
const {
  isRateLimitError,
  isNonceSmallError
} = require('../helpers')
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

    const pubProgress = await this.insertNewPublicDataToDb()
    let count = 0

    for (const authItem of this._auth) {
      if (typeof authItem[1] !== 'object') {
        continue
      }

      count += 1
      const userProgress = count / this._auth.size
      await this.insertNewDataToDb(authItem[1], userProgress, pubProgress)
    }

    await this.setProgress(100)
  }

  async insertNewPublicDataToDb () {
    const size = this._methodCollMap.size
    let count = 0
    let progress = 0

    const methodCollMap = await this.checkNewPublicData()

    for (const [method, item] of methodCollMap) {
      await this._updateApiDataArrObjTypeToDb(method, item)
      await this._updateApiDataArrTypeToDb(method, item)
      await this._insertApiDataPublicArrObjTypeToDb(method, item)

      count += 1
      progress = Math.round((count / size) * 100)

      if (progress < 100) {
        await this.setProgress(progress)
      }
    }

    return progress
  }

  async insertNewDataToDb (auth, userProgress = 1, pubProgress) {
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

      count += 1
      const progress = Math.round(pubProgress + (count / methodCollMap.size) * 100 * userProgress * ((100 - pubProgress) / 100))

      if (progress < 100) {
        await this.setProgress(progress)
      }
    }
  }

  _filterMethodCollMap (methodCollMap, isPublic) {
    return new Map([...methodCollMap].filter(([key, schema]) => {
      const _isPub = /^public:.*/i.test(schema.type)

      return schema.hasNewData && (isPublic ? _isPub : !_isPub)
    }))
  }

  async checkNewData (auth) {
    const methodCollMap = this._getMethodCollMap()

    await this._checkNewDataArrObjType(auth, methodCollMap)

    return this._filterMethodCollMap(methodCollMap)
  }

  async checkNewPublicData () {
    const methodCollMap = this._getMethodCollMap()

    await this._checkNewDataPublicArrObjType(methodCollMap)

    return this._filterMethodCollMap(methodCollMap, true)
  }

  async _checkNewDataPublicArrObjType (methodCollMap) {
    for (let [method, item] of methodCollMap) {
      if (!this._isInsertableArrObjTypeOfColl(item, true)) {
        continue
      }

      if (method === '_getPublicTrades') {
        await this._checkNewDataPublicTrades(method, item)

        continue
      }

      await this._checkItemNewDataArrObjType(method, item)
    }
  }

  // TODO:
  async _checkNewDataPublicTrades (method, schema) {
    const publicTradesConf = await this.dao.getElemsInCollBy('publicTradesConf')

    if (_.isEmpty(publicTradesConf)) {
      return
    }

    for (const { symbol, start } of publicTradesConf) {
      const args = this._getMethodArgMap(method, {}, 1)
      args.params.notThrowError = true
      args.params.notCheckNextPage = true
      const lastElemFromDb = await this.dao.getElemInCollBy(
        schema.name,
        { symbol },
        schema.sort
      )
      const { res: lastElemFromApi } = await this._getDataFromApi(method, args)

      schema.hasNewData = false

      if (_.isEmpty(lastElemFromApi)) {
        continue
      }
      if (_.isEmpty(lastElemFromDb)) {
        schema.hasNewData = true
        schema.start.push([symbol, { currStart: start }])

        continue
      }

      const lastDateInDb = this._compareElemsDbAndApi(
        schema.dateFieldName,
        lastElemFromDb,
        lastElemFromApi
      )

      const startConf = {
        baseStart: null,
        currStart: null
      }

      if (lastDateInDb) {
        schema.hasNewData = true
        startConf.currStart = lastDateInDb + 1
      }

      const firstElemFromDb = await this.dao.getElemInCollBy(
        schema.name,
        { symbol },
        this._invertSort(schema.sort)
      )

      if (!_.isEmpty(firstElemFromDb)) {
        const isChangedBaseStart = this._compareElemsDbAndApi(
          schema.dateFieldName,
          start,
          firstElemFromDb
        )

        if (isChangedBaseStart) {
          schema.hasNewData = true
          startConf.baseStart = start
        }
      }

      schema.start.push([symbol, startConf])
    }
  }

  _invertSort (sortArr) {
    return sortArr.map(item => {
      const _arr = [ ...item ]

      _arr[1] = item[1] > 0 ? -1 : 1

      return _arr
    })
  }

  async _checkItemNewDataArrObjType (
    method,
    schema,
    auth
  ) {
    const args = this._getMethodArgMap(method, auth, 1)
    args.params.notThrowError = true
    args.params.notCheckNextPage = true
    const lastElemFromDb = await this.dao.getLastElemFromDb(
      schema.name,
      { ...auth },
      schema.sort
    )
    const { res: lastElemFromApi } = await this._getDataFromApi(method, args)

    schema.hasNewData = false

    if (_.isEmpty(lastElemFromApi)) {
      return
    }

    if (_.isEmpty(lastElemFromDb)) {
      schema.hasNewData = true
      schema.start = 0
      return
    }

    const lastDateInDb = this._compareElemsDbAndApi(
      schema.dateFieldName,
      lastElemFromDb,
      lastElemFromApi
    )

    if (lastDateInDb) {
      schema.hasNewData = true
      schema.start = lastDateInDb + 1
    }
  }

  async _checkNewDataArrObjType (auth, methodCollMap) {
    for (let [method, item] of methodCollMap) {
      if (!this._isInsertableArrObjTypeOfColl(item)) {
        continue
      }

      await this._checkItemNewDataArrObjType(
        method,
        item,
        auth
      )
    }

    return methodCollMap
  }

  _checkCollType (type, coll, isPublic) {
    const _pub = isPublic ? 'public:' : ''
    const regExp = new RegExp(`^${_pub}${type}$`, 'i')

    return regExp.test(coll.type)
  }

  _isInsertableArrObjTypeOfColl (coll, isPublic) {
    return this._checkCollType(
      'insertable:array:objects',
      coll,
      isPublic
    )
  }

  _isUpdatableArrObjTypeOfColl (coll, isPublic) {
    return this._checkCollType(
      'updatable:array:objects',
      coll,
      isPublic
    )
  }

  _isUpdatableArrTypeOfColl (coll, isPublic) {
    return this._checkCollType(
      'updatable:array',
      coll,
      isPublic
    )
  }

  async _getDataFromApi (methodApi, args) {
    if (
      typeof this.reportService[methodApi] !== 'function'
    ) {
      throw new Error('ERR_METHOD_NOT_FOUND')
    }

    let countRateLimitError = 0
    let countNonceSmallError = 0
    let res = null

    while (true) {
      try {
        res = await this.reportService[methodApi](_.cloneDeep(args))

        break
      } catch (err) {
        if (isRateLimitError(err)) {
          countRateLimitError += 1

          if (countRateLimitError > 1) {
            throw err
          }

          await delay()

          continue
        } else if (isNonceSmallError(err)) {
          countNonceSmallError += 1

          if (countNonceSmallError > 20) {
            throw err
          }

          await delay(1000)

          continue
        } else throw err
      }
    }

    return res
  }

  // TODO:
  async _insertApiDataPublicArrObjTypeToDb (
    methodApi,
    schema
  ) {
    if (!this._isInsertableArrObjTypeOfColl(schema, true)) {
      return
    }
    if (methodApi === '_getPublicTrades') {
      return 0
    }
  }

  async _insertApiDataArrObjTypeToDb (
    auth,
    methodApi,
    schema
  ) {
    if (!this._isInsertableArrObjTypeOfColl(schema)) {
      return
    }

    const {
      start,
      name: collName,
      dateFieldName,
      model
    } = schema

    const args = this._getMethodArgMap(methodApi, auth, 10000000, start)
    const _args = _.cloneDeep(args)
    _args.params.notThrowError = true
    const currIterationArgs = _.cloneDeep(_args)

    let count = 0

    while (true) {
      let { res, nextPage } = await this._getDataFromApi(
        methodApi,
        currIterationArgs
      )

      if (
        !res ||
        !Array.isArray(res) ||
        res.length === 0
      ) break

      const lastItem = res[res.length - 1]

      if (
        !lastItem ||
        typeof lastItem !== 'object' ||
        !lastItem[dateFieldName] ||
        !Number.isInteger(lastItem[dateFieldName])
      ) break

      const currTime = lastItem[dateFieldName]
      let isAllData = false

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

      if (
        isAllData ||
        needElems <= 0 ||
        !nextPage
      ) {
        break
      }

      currIterationArgs.params.end = lastItem[dateFieldName] - 1
    }
  }

  async _updateApiDataArrTypeToDb (
    methodApi,
    schema
  ) {
    if (!this._isUpdatableArrTypeOfColl(schema, true)) {
      return
    }

    const {
      name: collName,
      field
    } = schema

    const args = this._getMethodArgMap(methodApi, {}, null, null, null)
    const elemsFromApi = await this._getDataFromApi(methodApi, args)

    if (
      Array.isArray(elemsFromApi) &&
      elemsFromApi.length > 0
    ) {
      await this.dao.removeElemsFromDbIfNotInLists(
        collName,
        { [field]: elemsFromApi }
      )
      await this.dao.insertElemsToDbIfNotExists(
        collName,
        elemsFromApi.map(item => ({ [field]: item }))
      )
    }
  }

  async _updateApiDataArrObjTypeToDb (
    methodApi,
    schema
  ) {
    if (!this._isUpdatableArrObjTypeOfColl(schema, true)) {
      return
    }

    const {
      name: collName,
      fields,
      model
    } = schema

    const args = this._getMethodArgMap(methodApi, {}, null, null, null)
    const elemsFromApi = await this._getDataFromApi(methodApi, args)

    if (
      Array.isArray(elemsFromApi) &&
      elemsFromApi.length > 0
    ) {
      const lists = fields.reduce((obj, curr) => {
        obj[curr] = elemsFromApi.map(item => item[curr])

        return obj
      }, {})

      await this.dao.removeElemsFromDbIfNotInLists(
        collName,
        lists
      )
      await this.dao.insertElemsToDbIfNotExists(
        collName,
        this._normalizeApiData(elemsFromApi, model)
      )
    }
  }

  _compareElemsDbAndApi (dateFieldName, elDb, elApi) {
    const _elDb = Array.isArray(elDb) ? elDb[0] : elDb
    const _elApi = Array.isArray(elApi) ? elApi[0] : elApi

    return (_elDb[dateFieldName] < _elApi[dateFieldName])
      ? _elDb[dateFieldName]
      : false
  }

  _getMethodArgMap (
    method,
    auth,
    limit,
    start = 0,
    end = (new Date()).getTime()
  ) {
    return {
      auth: {
        apiKey: '',
        apiSecret: '',
        ...auth
      },
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
