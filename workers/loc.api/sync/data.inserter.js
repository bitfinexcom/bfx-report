'use strict'

const EventEmitter = require('events')
const _ = require('lodash')

const {
  delay,
  checkCollPermission
} = require('./helpers')
const {
  isRateLimitError,
  isNonceSmallError
} = require('../helpers')
const { getMethodCollMap } = require('./schema')
const {
  DataInserterExtension
} = require('bfx-facs-reports-framework/sync/data.inserter.extension')
const { ALLOWED_COLLS } = require('./allowed.colls')

const MESS_ERR_UNAUTH = 'ERR_AUTH_UNAUTHORIZED'

class DataInserter extends EventEmitter {
  constructor (
    reportService,
    syncColls = ALLOWED_COLLS.ALL,
    methodCollMap
  ) {
    super()

    this.reportService = reportService
    this.dao = this.reportService.dao

    this._asyncProgressHandler = null
    this._auth = null
    this._allowedCollsNames = Object.values(ALLOWED_COLLS)
      .filter(name => !(/^_.*/.test(name)))
    this._syncColls = syncColls && Array.isArray(syncColls)
      ? syncColls
      : [syncColls]

    checkCollPermission(this._syncColls)

    this._methodCollMap = this._filterMethodCollMapByList(methodCollMap)

    this._initExtensions(this._methodCollMap)
  }

  _initExtensions (methodCollMap) {
    for (const item of methodCollMap) {
      const ext = item[1].extension

      if (ext instanceof DataInserterExtension) {
        ext.injectDeps(this, ALLOWED_COLLS)
      }
    }
  }

  _reduceMethodCollMap (
    _methodCollMap,
    res,
    cb = () => true
  ) {
    return [..._methodCollMap].reduce((accum, curr) => {
      if (
        accum.every(item => item.name !== curr[1].name) &&
        res.every(item => item.name !== curr[1].name) &&
        cb(curr)
      ) {
        accum.push(curr)
      }

      return accum
    }, [])
  }

  _isPubColl (coll) {
    return /^public:.*/i.test(coll[1].type)
  }

  _isAllowedColl (coll) {
    return this._allowedCollsNames.some(item => item === coll[1].name)
  }

  _filterMethodCollMapByList (
    methodCollMap,
    syncColls = this._syncColls
  ) {
    const res = []
    const _methodCollMap = (methodCollMap instanceof Map)
      ? new Map(methodCollMap)
      : getMethodCollMap()

    for (const collName of syncColls) {
      if (collName === ALLOWED_COLLS.ALL) {
        const subRes = this._reduceMethodCollMap(
          _methodCollMap,
          res,
          coll => this._isAllowedColl(coll)
        )

        res.push(...subRes)

        break
      }
      if (collName === ALLOWED_COLLS.PUBLIC) {
        const subRes = this._reduceMethodCollMap(
          _methodCollMap,
          res,
          coll => (this._isAllowedColl(coll) && this._isPubColl(coll))
        )

        res.push(...subRes)

        continue
      }
      if (collName === ALLOWED_COLLS.PRIVATE) {
        const subRes = this._reduceMethodCollMap(
          _methodCollMap,
          res,
          coll => (this._isAllowedColl(coll) && !this._isPubColl(coll))
        )

        res.push(...subRes)

        continue
      }

      const subRes = this._reduceMethodCollMap(
        _methodCollMap,
        res,
        curr => curr[1].name === collName
      )

      res.push(...subRes)
    }

    return new Map(res)
  }

  setAsyncProgressHandler (cb) {
    if (typeof cb !== 'function') {
      throw new Error('ERR_ASYNC_PROGRESS_HANDLER_IS_NOT_FUNCTION')
    }

    this._asyncProgressHandler = cb
  }

  async setProgress (progress) {
    if (this._asyncProgressHandler) {
      await this._asyncProgressHandler(progress)
    }

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

    let count = 0
    let progress = 0

    for (const authItem of this._auth) {
      if (typeof authItem[1] !== 'object') {
        continue
      }

      count += 1
      const userProgress = count / this._auth.size
      progress = await this.insertNewDataToDb(authItem[1], userProgress)
    }

    await this.insertNewPublicDataToDb(progress)

    await this.setProgress(100)
  }

  async insertNewPublicDataToDb (prevProgress) {
    const methodCollMap = await this.checkNewPublicData()
    const size = methodCollMap.size

    let count = 0
    let progress = 0

    for (const [method, item] of methodCollMap) {
      await this._updateApiDataArrObjTypeToDb(method, item)
      await this._updateApiDataArrTypeToDb(method, item)
      await this._insertApiDataPublicArrObjTypeToDb(method, item)

      count += 1
      progress = Math.round(prevProgress + (count / size) * 100 * ((100 - prevProgress) / 100))

      if (progress < 100) {
        await this.setProgress(progress)
      }
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
    const size = this._methodCollMap.size

    let count = 0
    let progress = 0

    for (const [method, schema] of methodCollMap) {
      if (schema.extension instanceof DataInserterExtension) {
        await schema.extension.insertNewData(method, schema, auth)
      } else {
        const args = this.getMethodArgMap(method, auth, 10000000, schema.start)

        await this._insertApiDataArrObjTypeToDb(args, method, schema)
      }

      count += 1
      progress = Math.round((count / size) * 100 * userProgress)

      if (progress < 100) {
        await this.setProgress(progress)
      }
    }

    return progress
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
    for (let [method, schema] of methodCollMap) {
      if (!this._isInsertableArrObjTypeOfColl(schema, true)) {
        continue
      }
      if (
        schema.name === ALLOWED_COLLS.PUBLIC_TRADES ||
        schema.name === ALLOWED_COLLS.TICKERS_HISTORY
      ) {
        await this._checkNewConfigurablePublicData(method, schema)

        continue
      }
      if (schema.extension instanceof DataInserterExtension) {
        await schema.extension.checkNewData(method, schema)

        continue
      }

      await this._checkItemNewDataArrObjType(method, schema)
    }
  }

  async _checkNewConfigurablePublicData (method, schema) {
    schema.hasNewData = false

    const symbFieldName = schema.symbolFieldName
    const publicСollsСonf = await this.dao.getElemsInCollBy(
      'publicСollsСonf',
      {
        filter: { confName: schema.confName },
        minPropName: 'start',
        groupPropName: 'symbol'
      }
    )

    if (_.isEmpty(publicСollsСonf)) {
      return
    }

    for (const { symbol, start } of publicСollsСonf) {
      const args = this.getMethodArgMap(method, {}, 1)
      args.params.notThrowError = true
      args.params.notCheckNextPage = true
      args.params.symbol = symbol
      const filter = { [symbFieldName]: symbol }
      const lastElemFromDb = await this.dao.getElemInCollBy(
        schema.name,
        filter,
        schema.sort
      )
      const { res: lastElemFromApi } = await this.getDataFromApi(method, args)

      if (
        _.isEmpty(lastElemFromApi) ||
        (
          Array.isArray(lastElemFromApi) &&
          lastElemFromApi[0][symbFieldName] &&
          typeof lastElemFromApi[0][symbFieldName] === 'string' &&
          lastElemFromApi[0][symbFieldName] !== symbol
        )
      ) {
        continue
      }
      if (_.isEmpty(lastElemFromDb)) {
        schema.hasNewData = true
        schema.start.push([symbol, { currStart: start }])

        continue
      }

      const lastDateInDb = this.compareElemsDbAndApi(
        schema.dateFieldName,
        lastElemFromDb,
        lastElemFromApi
      )

      const startConf = {
        baseStartFrom: null,
        baseStartTo: null,
        currStart: null
      }

      if (lastDateInDb) {
        schema.hasNewData = true
        startConf.currStart = lastDateInDb + 1
      }

      const firstElemFromDb = await this.dao.getElemInCollBy(
        schema.name,
        filter,
        this.invertSort(schema.sort)
      )

      if (!_.isEmpty(firstElemFromDb)) {
        const isChangedBaseStart = this.compareElemsDbAndApi(
          schema.dateFieldName,
          { [schema.dateFieldName]: start },
          firstElemFromDb
        )

        if (isChangedBaseStart) {
          schema.hasNewData = true
          startConf.baseStartFrom = start
          startConf.baseStartTo = firstElemFromDb[schema.dateFieldName] - 1
        }
      }

      schema.start.push([symbol, startConf])
    }
  }

  invertSort (sortArr) {
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
    schema.hasNewData = false

    const args = this.getMethodArgMap(method, auth, 1)
    args.params.notThrowError = true
    args.params.notCheckNextPage = true
    const lastElemFromDb = await this.dao.getLastElemFromDb(
      schema.name,
      { ...(auth || {}) },
      schema.sort
    )
    const { res: lastElemFromApi } = await this.getDataFromApi(method, args)

    if (_.isEmpty(lastElemFromApi)) {
      return
    }

    if (_.isEmpty(lastElemFromDb)) {
      schema.hasNewData = true
      schema.start = 0
      return
    }

    const lastDateInDb = this.compareElemsDbAndApi(
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
    for (let [method, schema] of methodCollMap) {
      if (!this._isInsertableArrObjTypeOfColl(schema)) {
        continue
      }
      if (schema.extension instanceof DataInserterExtension) {
        await schema.extension.checkNewData(method, schema, auth)

        continue
      }

      await this._checkItemNewDataArrObjType(
        method,
        schema,
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

  async getDataFromApi (methodApi, args) {
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

  async _insertApiDataPublicArrObjTypeToDb (
    methodApi,
    schema
  ) {
    if (!this._isInsertableArrObjTypeOfColl(schema, true)) {
      return
    }
    if (
      schema.name === ALLOWED_COLLS.PUBLIC_TRADES ||
      schema.name === ALLOWED_COLLS.TICKERS_HISTORY
    ) {
      for (const [symbol, dates] of schema.start) {
        await this.insertConfigurablePublicApiData(
          methodApi,
          schema,
          symbol,
          dates,
          {},
          (itemRes, params) => {
            if (
              schema.name === ALLOWED_COLLS.PUBLIC_TRADES &&
              typeof params.symbol === 'string'
            ) {
              itemRes._symbol = params.symbol
            }
          }
        )
      }
    }
    if (schema.extension instanceof DataInserterExtension) {
      await schema.extension.insertNewData(methodApi, schema)
    }
  }

  async insertConfigurablePublicApiData (
    methodApi,
    schema,
    symbol,
    dates,
    addApiParams = {},
    customNormalizer
  ) {
    if (
      !dates ||
      typeof dates !== 'object'
    ) {
      return
    }
    if (
      Number.isInteger(dates.baseStartFrom) &&
      Number.isInteger(dates.baseStartTo)
    ) {
      const args = this.getMethodArgMap(
        methodApi,
        null,
        10000000,
        dates.baseStartFrom,
        dates.baseStartTo
      )
      args.params = {
        ...args.params,
        symbol,
        ...addApiParams
      }

      await this._insertApiDataArrObjTypeToDb(
        args,
        methodApi,
        schema,
        true,
        customNormalizer
      )
    }
    if (Number.isInteger(dates.currStart)) {
      const args = this.getMethodArgMap(
        methodApi,
        null,
        10000000,
        dates.currStart
      )
      args.params = {
        ...args.params,
        symbol,
        ...addApiParams
      }

      await this._insertApiDataArrObjTypeToDb(
        args,
        methodApi,
        schema,
        true,
        customNormalizer
      )
    }
  }

  async _insertApiDataArrObjTypeToDb (
    args,
    methodApi,
    schema,
    isPublic,
    customNormalizer
  ) {
    if (!this._isInsertableArrObjTypeOfColl(schema, isPublic)) {
      return
    }

    const {
      name: collName,
      dateFieldName,
      model
    } = schema

    const _args = _.cloneDeep(args)
    _args.params.notThrowError = true
    const currIterationArgs = _.cloneDeep(_args)

    let count = 0
    let serialRequestsCount = 0

    while (true) {
      let { res, nextPage } = await this.getDataFromApi(
        methodApi,
        currIterationArgs
      )

      currIterationArgs.params.end = nextPage

      if (
        res &&
        Array.isArray(res) &&
        res.length === 0 &&
        nextPage &&
        Number.isInteger(nextPage) &&
        serialRequestsCount < 1
      ) {
        serialRequestsCount += 1

        continue
      }

      serialRequestsCount = 0

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
        isPublic ? null : { ..._args.auth },
        this._normalizeApiData(res, model, itemRes => {
          if (typeof customNormalizer === 'function') {
            customNormalizer(itemRes, args.params)
          }
        })
      )

      count += res.length
      const needElems = _args.params.limit - count

      if (
        isAllData ||
        needElems <= 0 ||
        !nextPage ||
        !Number.isInteger(nextPage)
      ) {
        break
      }

      if (!Number.isInteger(currIterationArgs.params.end)) {
        currIterationArgs.params.end = lastItem[dateFieldName] - 1
      }
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

    const args = this.getMethodArgMap(methodApi, {}, null, null, null)
    const elemsFromApi = await this.getDataFromApi(methodApi, args)

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
        null,
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

    const args = this.getMethodArgMap(methodApi, {}, null, null, null)
    const elemsFromApi = await this.getDataFromApi(methodApi, args)

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
        null,
        this._normalizeApiData(elemsFromApi, model)
      )
    }
  }

  compareElemsDbAndApi (dateFieldName, elDb, elApi) {
    const _elDb = Array.isArray(elDb) ? elDb[0] : elDb
    const _elApi = Array.isArray(elApi) ? elApi[0] : elApi

    return (_elDb[dateFieldName] < _elApi[dateFieldName])
      ? _elDb[dateFieldName]
      : false
  }

  getMethodArgMap (
    method,
    auth,
    limit,
    start = 0,
    end = Date.now()
  ) {
    return {
      auth: {
        ...(auth && typeof auth === 'object'
          ? auth
          : {
            apiKey: '',
            apiSecret: ''
          })
      },
      params: {
        limit: limit !== null
          ? limit
          : this._methodCollMap.get(method).maxLimit,
        end,
        start
      }
    }
  }

  _getMethodCollMap () {
    return new Map(this._methodCollMap)
  }

  _normalizeApiData (data = [], model, cb = () => {}) {
    return data.map(item => {
      if (
        typeof item !== 'object' ||
        typeof model !== 'object' ||
        Object.keys(model).length === 0
      ) {
        return item
      }

      cb(item)

      return _.pick(item, Object.keys(model))
    })
  }
}

module.exports = DataInserter
