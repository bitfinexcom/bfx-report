'use strict'

const { isEmpty, pick, omit } = require('lodash')

const DAO = require('./dao')
const {
  checkParamsAuth,
  getLimitNotMoreThan,
  refreshObj,
  prepareResponse,
  mapObjBySchema
} = require('../../helpers')
const {
  mixUserIdToArrData,
  convertDataType,
  serializeVal,
  getWhereQuery,
  getOrderQuery,
  getUniqueIndexQuery
} = require('./helpers')
const {
  AuthError,
  RemoveListElemsError,
  UpdateStateCollError,
  UpdateSyncProgressError
} = require('../../errors')

class SqliteDAO extends DAO {
  _run (sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          reject(err)

          return
        }

        resolve(this)
      })
    })
  }

  _get (sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, result) => {
        if (err) {
          reject(err)

          return
        }

        resolve(result)
      })
    })
  }

  _all (sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err)

          return
        }

        resolve(rows)
      })
    })
  }

  _commit () {
    return this._run('COMMIT')
  }

  _rollback () {
    return this._run('ROLLBACK')
  }

  _beginTrans (asyncExecQuery) {
    return new Promise((resolve, reject) => {
      this.db.serialize(async () => {
        let isTransBegun = false

        try {
          await this._run('BEGIN TRANSACTION')
          isTransBegun = true

          await asyncExecQuery()
          await this._commit()

          resolve()
        } catch (err) {
          if (isTransBegun) {
            await this._rollback()
          }

          reject(err)
        }
      })
    })
  }

  async _createTablesIfNotExists () {
    for (const [name, model] of this._getModelsMap()) {
      let sql = `CREATE TABLE IF NOT EXISTS ${name} (\n`

      Object.keys(model).forEach((field, i, arr) => {
        const isLast = arr.length === (i + 1)

        sql += `${field} ${model[field].replace(/[#]\{field\}/g, field)}${isLast ? '' : ', \n'}`
      })

      sql += ')'

      await this._run(sql)
    }
  }

  async _createIndexisIfNotExists () {
    for (let currItem of this._getMethodCollMap()) {
      const item = currItem[1]

      if (item.type === 'insertable:array:objects') {
        const sql = `CREATE INDEX IF NOT EXISTS
          ${item.name}_${item.dateFieldName}_${item.symbolFieldName}
          ON ${item.name}(${item.dateFieldName}, ${item.symbolFieldName})`

        await this._run(sql)
      }

      if (
        item.fieldsOfUniqueIndex &&
        Array.isArray(item.fieldsOfUniqueIndex)
      ) {
        const sql = getUniqueIndexQuery(item.name, item.fieldsOfUniqueIndex)

        await this._run(sql)
      }
    }

    const publicСollsСonfSql = getUniqueIndexQuery(
      'publicСollsСonf',
      ['symbol', 'user_id', 'confName']
    )

    await this._run(publicСollsСonfSql)
  }

  async _getUserByAuth (auth) {
    const sql = `SELECT * FROM users
      WHERE users.apiKey = $apiKey
      AND users.apiSecret = $apiSecret`

    const res = await this._get(sql, {
      $apiKey: auth.apiKey,
      $apiSecret: auth.apiSecret
    })

    if (res && typeof res === 'object') {
      res.active = !!res.active
      res.isDataFromDb = !!res.isDataFromDb
    }

    return res
  }

  /**
   * @override
   */
  async databaseInitialize () {
    await this._beginTrans(async () => {
      await this._createTablesIfNotExists()
      await this._createIndexisIfNotExists()
    })
  }

  /**
   * @override
   */
  async getLastElemFromDb (name, auth, sort = []) {
    const _sort = getOrderQuery(sort)

    const sql = `SELECT ${name}.* FROM ${name}
      INNER JOIN users ON users._id = ${name}.user_id
      WHERE users.apiKey = $apiKey
      AND users.apiSecret = $apiSecret
      ${_sort}`

    return this._get(sql, {
      $apiKey: auth.apiKey,
      $apiSecret: auth.apiSecret
    })
  }

  /**
   * @override
   */
  async insertElemsToDb (name, auth, data = []) {
    await mixUserIdToArrData(this, auth, data)

    await this._beginTrans(async () => {
      for (const obj of data) {
        const fields = Object.keys(obj).join(', ')
        const values = {}
        const placeholders = Object.keys(obj)
          .map((item) => {
            const key = `$${item}`

            values[key] = serializeVal(obj[item])

            return `${key}`
          })
          .join(', ')

        const sql = `INSERT INTO ${name}(${fields}) VALUES (${placeholders})`

        await this._run(sql, values)
      }
    })
  }

  /**
   * @override
   */
  async insertElemsToDbIfNotExists (name, auth, data = []) {
    await mixUserIdToArrData(this, auth, data)

    await this._beginTrans(async () => {
      for (const obj of data) {
        const keys = Object.keys(obj)

        if (keys.length === 0) {
          continue
        }

        const fields = keys.join(', ')
        const values = {}
        let where = 'WHERE '
        const placeholders = keys
          .map((item, i) => {
            const key = `$${item}`
            where += `${i > 0 ? ' AND ' : ''}${item} = ${key}`

            values[key] = serializeVal(obj[item])

            return `${key}`
          })
          .join(', ')

        const sql = `INSERT INTO ${name}(${fields}) SELECT ${placeholders}
                      WHERE NOT EXISTS(SELECT 1 FROM ${name} ${where})`

        await this._run(sql, values)
      }
    })
  }

  /**
   * @override
   */
  async checkAuthInDb (args, isCheckActiveState = true) {
    checkParamsAuth(args)

    const user = await this._getUserByAuth(args.auth)

    if (
      isEmpty(user) ||
      (isCheckActiveState && !user.active)
    ) {
      throw new AuthError()
    }

    return user
  }

  /**
   * @override
   */
  async findInCollBy (method, args, isPrepareResponse, isPublic) {
    const user = isPublic ? null : await this.checkAuthInDb(args)
    const methodColl = this._getMethodCollMap().get(method)
    const params = { ...args.params }
    params.limit = methodColl.maxLimit
      ? getLimitNotMoreThan(params.limit, methodColl.maxLimit)
      : null

    const exclude = ['_id']
    const fields = []
    const filter = {}

    if (/^((public:)|())insertable:array:objects$/i.test(methodColl.type)) {
      filter._dateFieldName = methodColl.dateFieldName
      filter.start = params.start ? params.start : 0
      filter.end = params.end ? params.end : (new Date()).getTime()

      if (
        typeof params.isMarginFundingPayment === 'boolean' &&
        Object.keys(methodColl.model).some(key => key === '_isMarginFundingPayment')
      ) {
        filter._isMarginFundingPayment = Number(params.isMarginFundingPayment)
      }
      if (params.symbol) {
        if (typeof params.symbol === 'string') {
          filter[methodColl.symbolFieldName] = params.symbol
        } else if (
          Array.isArray(params.symbol) &&
          params.symbol.length === 1
        ) {
          filter[methodColl.symbolFieldName] = params.symbol[0]
        }
      }
    }
    if (!isPublic) {
      exclude.push('user_id')
      filter.user_id = user._id
    }

    const limit = params.limit ? 'LIMIT $limit' : ''
    const sort = getOrderQuery(methodColl.sort)
    const {
      where,
      values
    } = getWhereQuery(filter)
    const group = (
      Array.isArray(methodColl.groupResBy) &&
      methodColl.groupResBy.length > 0
    )
      ? `GROUP BY ${methodColl.groupResBy.join(', ')}`
      : ''

    if (params.limit) {
      values.$limit = params.limit
    }

    Object.keys(methodColl.model).forEach(field => {
      if (
        exclude.every(item => item !== field) &&
        !/^_.*/.test(field)
      ) {
        fields.push(field)
      }
    })

    const sql = `SELECT ${fields.join(', ')} FROM ${methodColl.name}
      ${where}
      ${group}
      ${sort}
      ${limit}`

    const _res = await this._all(sql, values)
    let res = convertDataType(_res)

    if (isPrepareResponse) {
      const symbols = (
        params.symbol &&
        Array.isArray(params.symbol) &&
        params.symbol.length > 1
      ) ? params.symbol : []

      res = prepareResponse(
        res,
        methodColl.dateFieldName,
        params.limit,
        params.notThrowError,
        params.notCheckNextPage,
        symbols,
        methodColl.symbolFieldName
      )
    }

    return res
  }

  /**
   * @override
   */
  async getActiveUsers () {
    const sql = 'SELECT * FROM users WHERE active = 1'

    const res = await this._all(sql)

    return res.map(item => {
      item.active = !!item.active

      return item
    })
  }

  /**
   * @override
   */
  async updateCollBy (name, filter = {}, data = {}) {
    const {
      where,
      values
    } = getWhereQuery(filter)
    const fields = Object.keys(data).map(item => {
      const key = `$new_${item}`
      values[key] = data[item]

      return `${item} = ${key}`
    }).join(', ')

    const sql = `UPDATE ${name} SET ${fields} ${where}`

    return this._run(sql, values)
  }

  /**
   * @override
   */
  async updateElemsInCollBy (
    name,
    data = [],
    filterPropNames = {},
    upPropNames = {}
  ) {
    await this._beginTrans(async () => {
      for (const item of data) {
        await this.updateCollBy(
          name,
          mapObjBySchema(item, filterPropNames),
          mapObjBySchema(item, upPropNames)
        )
      }
    })
  }

  /**
   * @override
   */
  async insertOrUpdateUser (data) {
    const user = await this._getUserByAuth(data)

    if (isEmpty(user)) {
      if (!data.email) {
        throw new AuthError()
      }

      return this.insertElemsToDb(
        'users',
        null,
        [{
          ...pick(
            data,
            [
              'apiKey',
              'apiSecret',
              'email',
              'timezone',
              'username'
            ]
          ),
          active: 1,
          isDataFromDb: 1
        }]
      )
    }

    const newData = { active: 1 }

    refreshObj(
      user,
      newData,
      data,
      ['email', 'timezone', 'username']
    )

    const res = await this.updateCollBy(
      'users',
      { _id: user._id },
      omit(newData, ['_id'])
    )

    if (res && res.changes < 1) {
      throw new AuthError()
    }

    return res
  }

  /**
   * @override
   */
  async updateUserByAuth (data) {
    const props = ['apiKey', 'apiSecret']
    const res = await this.updateCollBy(
      'users',
      pick(data, props),
      omit(data, [ ...props, '_id' ])
    )

    if (res && res.changes < 1) {
      throw new AuthError()
    }

    return res
  }

  /**
   * @override
   */
  async deactivateUser (auth) {
    const res = await this.updateUserByAuth({
      ...pick(auth, ['apiKey', 'apiSecret']),
      active: 0
    })

    return res
  }

  /**
   * @override
   */
  getElemsInCollBy (
    collName,
    {
      filter = {},
      sort = [],
      minPropName = null,
      groupPropName = null,
      isDistinct = false,
      projection = [],
      limit = null
    } = {}
  ) {
    const subQuery = (
      minPropName &&
      typeof minPropName === 'string' &&
      groupPropName &&
      typeof groupPropName === 'string'
    ) ? `${minPropName} = (SELECT MIN(${minPropName}) FROM ${collName} AS b
        WHERE b.${groupPropName} = a.${groupPropName})
        GROUP BY ${groupPropName}`
      : ''

    const _sort = getOrderQuery(sort)

    const {
      where,
      values
    } = getWhereQuery(filter, true)
    const _projection = Array.isArray(projection) && projection.length > 0
      ? projection.join(', ')
      : '*'
    const distinct = isDistinct ? 'DISTINCT ' : ''
    const _limit = Number.isInteger(limit) ? 'LIMIT $_limit' : ''
    const limitVal = _limit ? { $_limit: limit } : {}

    const sql = `SELECT ${distinct}${_projection} FROM ${collName} AS a
      ${where || subQuery ? ' WHERE ' : ''}${where}${where && subQuery ? ' AND ' : ''}${subQuery}
      ${_sort}
      ${_limit}`

    return this._all(sql, { ...values, ...limitVal })
  }

  /**
   * @override
   */
  getElemInCollBy (collName, filter = {}, sort = []) {
    const _sort = getOrderQuery(sort)
    const {
      where,
      values
    } = getWhereQuery(filter)

    const sql = `SELECT * FROM ${collName}
      ${where}
      ${_sort}`

    return this._get(sql, values)
  }

  /**
   * @override
   */
  async removeElemsFromDb (name, auth, data = {}) {
    if (auth) {
      const user = await this.checkAuthInDb({ auth })

      data.user_id = user._id
    }

    const values = {}
    let where = Object.keys(data).reduce((accum, curr, i) => {
      const isArr = Array.isArray(data[curr])
      let key = `$${curr}`

      if (isArr) {
        key = '('
        key += data[curr].map((item, i) => {
          const subKey = `$${curr}_${i}`
          values[subKey] = item

          return subKey
        }).join(', ')
        key += ')'
      } else {
        values[key] = data[curr]
      }

      return `${accum}${i > 0 ? ' AND ' : ''}${curr} ${isArr ? 'IN' : '='} ${key}`
    }, 'WHERE ')

    const sql = `DELETE FROM ${name} ${where}`

    return this._run(sql, values)
  }

  /**
   * @override
   */
  async removeElemsFromDbIfNotInLists (name, lists) {
    const values = {}
    let where = Object.keys(lists).reduce((accum, curr, i) => {
      if (!Array.isArray(lists[curr])) {
        throw new RemoveListElemsError()
      }

      let key = '('

      key += lists[curr].map((item, i) => {
        const subKey = `$${curr}_${i}`
        values[subKey] = serializeVal(item)

        return subKey
      }).join(', ')
      key += ')'

      return `${accum}${i > 0 ? ' OR ' : ''}${curr} NOT IN ${key}`
    }, 'WHERE ')

    const sql = `DELETE FROM ${name} ${where}`

    await this._run(sql, values)
  }

  /**
   * @override
   */
  async updateStateOf (name, isEnable = 1) {
    const elems = await this.getElemsInCollBy(name)
    const data = {
      isEnable: isEnable ? 1 : 0
    }

    if (elems.length > 1) {
      await this.removeElemsFromDb(name, null, {
        _id: elems.filter((item, i) => i !== 0)
      })
    }

    if (isEmpty(elems)) {
      return this.insertElemsToDb(
        name,
        null,
        [data]
      )
    }

    const res = await this.updateCollBy(
      name,
      { _id: elems[0]._id },
      data
    )

    if (res && res.changes < 1) {
      throw new UpdateStateCollError()
    }

    return res
  }

  /**
   * @override
   */
  getFirstElemInCollBy (collName, filter = {}) {
    const {
      where,
      values
    } = getWhereQuery(filter)

    const sql = `SELECT * FROM ${collName} ${where}`

    return this._get(sql, values)
  }

  /**
   * @override
   */
  async updateProgress (value) {
    const name = 'progress'
    const elems = await this.getElemsInCollBy(name)
    const data = {
      value: JSON.stringify(value)
    }

    if (elems.length > 1) {
      await this.removeElemsFromDb(name, null, {
        _id: elems.filter((item, i) => i !== 0)
      })
    }

    if (isEmpty(elems)) {
      return this.insertElemsToDb(
        name,
        null,
        [data]
      )
    }

    const res = await this.updateCollBy(
      name,
      { _id: elems[0]._id },
      data
    )

    if (res && res.changes < 1) {
      throw new UpdateSyncProgressError()
    }

    return res
  }

  /**
   * @override
   */
  async getCountBy (name, filter = {}) {
    const {
      where,
      values
    } = getWhereQuery(filter)

    const sql = `SELECT count(*) AS res FROM ${name} ${where}`
    const { res } = await this._get(sql, values)

    return res
  }
}

module.exports = SqliteDAO
