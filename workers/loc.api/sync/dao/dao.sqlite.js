'use strict'

const { isEmpty, pick } = require('lodash')

const DAO = require('./dao')
const {
  checkParamsAuth,
  getLimitNotMoreThan,
  refreshObj,
  tryParseJSON,
  prepareResponse
} = require('../../helpers')

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

  _serializeVal (val) {
    if (typeof val === 'boolean') {
      return +val
    } else if (typeof val === 'object') {
      return JSON.stringify(val)
    }

    return val
  }

  _deserializeVal (
    val,
    key,
    boolFields = ['notify', 'hidden', 'renew', 'noClose', 'maker']
  ) {
    if (
      typeof val === 'string' &&
      /^null$/.test(val)
    ) {
      return null
    } else if (
      typeof val === 'number' &&
      boolFields.some(item => item === key)
    ) {
      return !!val
    } else if (
      typeof val === 'string' &&
      key === 'rate'
    ) {
      const _val = parseFloat(val)

      return isFinite(_val) ? _val : val
    } else if (tryParseJSON(val)) {
      return tryParseJSON(val)
    }

    return val
  }

  /**
   * @override
   */
  async databaseInitialize () {
    try {
      await this._run('BEGIN TRANSACTION')
      await this._createTablesIfNotExists()
      await this._createIndexisIfNotExists()
      await this._run('COMMIT')
    } catch (err) {
      await this._run('ROLLBACK')

      throw err
    }
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
        let sql = `CREATE INDEX IF NOT EXISTS ${item.name}_${item.dateFieldName}_${item.symbolFieldName}
          ON ${item.name}(${item.dateFieldName}, ${item.symbolFieldName})`

        await this._run(sql)
      }

      if (
        item.fieldsOfUniqueIndex &&
        Array.isArray(item.fieldsOfUniqueIndex)
      ) {
        let sql = `CREATE UNIQUE INDEX IF NOT EXISTS ${item.name}_${item.fieldsOfUniqueIndex.join('_')}
          ON ${item.name}(${item.fieldsOfUniqueIndex.join(', ')})`

        await this._run(sql)
      }
    }
  }

  /**
   * @override
   */
  async getLastElemFromDb (name, auth, sort = []) {
    const _sort = []

    if (Array.isArray(sort)) {
      sort.forEach(item => {
        if (
          Array.isArray(item) &&
          typeof item[0] === 'string' &&
          typeof item[1] === 'number'
        ) {
          _sort.push(`${item[0]} ${item[1] > 0 ? 'ASC' : 'DESC'}`)
        }
      })
    }

    const sql = `SELECT ${name}.* FROM ${name}
      INNER JOIN users ON users._id = ${name}.user_id
      WHERE users.apiKey = $apiKey
      AND users.apiSecret = $apiSecret
      ORDER BY ${_sort.join(', ')}`

    return this._get(sql, {
      $apiKey: auth.apiKey,
      $apiSecret: auth.apiSecret
    })
  }

  /**
   * @override
   */
  async insertElemsToDb (name, auth, data = []) {
    if (auth) {
      const user = await this.checkAuthInDb({ auth })

      data.forEach(item => {
        item.user_id = user._id
      })
    }

    try {
      await this._run('BEGIN TRANSACTION')

      for (const obj of data) {
        const fields = Object.keys(obj).join(', ')
        const values = {}
        const placeholders = Object.keys(obj)
          .map((item) => {
            const key = `$${item}`

            values[key] = this._serializeVal(obj[item])

            return `${key}`
          })
          .join(', ')

        const sql = `INSERT INTO ${name}(${fields}) VALUES (${placeholders})`

        await this._run(sql, values)
      }

      await this._run('COMMIT')
    } catch (err) {
      await this._run('ROLLBACK')

      throw err
    }
  }

  /**
   * @override
   */
  async insertElemsToDbIfNotExists (name, data = []) {
    try {
      await this._run('BEGIN TRANSACTION')

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

            values[key] = this._serializeVal(obj[item])

            return `${key}`
          })
          .join(', ')

        const sql = `INSERT INTO ${name}(${fields}) SELECT ${placeholders}
                      WHERE NOT EXISTS(SELECT 1 FROM ${name} ${where})`

        await this._run(sql, values)
      }

      await this._run('COMMIT')
    } catch (err) {
      await this._run('ROLLBACK')

      throw err
    }
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
      throw new Error('ERR_AUTH_UNAUTHORIZED')
    }

    return user
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
  async findInCollBy (method, args, isPrepareResponse) {
    const user = await this.checkAuthInDb(args)
    const methodColl = this._getMethodCollMap().get(method)
    const params = { ...args.params }
    params.limit = getLimitNotMoreThan(params.limit, methodColl.maxLimit)

    const exclude = ['_id']
    const fields = []
    const values = {
      $limit: params.limit
    }
    let where = ''
    const sort = []

    if (/^((public:)|())insertable:array:objects$/i.test(methodColl.type)) {
      values['$start'] = params.start ? params.start : 0
      values['$end'] = params.end ? params.end : (new Date()).getTime()
      where += `WHERE ${methodColl.dateFieldName} >= $start
        AND ${methodColl.dateFieldName} <= $end \n`

      if (params.symbol) {
        if (typeof params.symbol === 'string') {
          values['$symbol'] = params.symbol
          where += `AND ${methodColl.symbolFieldName} = $symbol \n`
        } else if (
          Array.isArray(params.symbol) &&
          params.symbol.length === 1
        ) {
          values['$symbol'] = params.symbol[0]
          where += `AND ${methodColl.symbolFieldName} = $symbol \n`
        }
      }
    }
    if (
      typeof methodColl.sort !== 'undefined' &&
      Array.isArray(methodColl.sort)
    ) {
      methodColl.sort.forEach(item => {
        if (
          Array.isArray(item) &&
          typeof item[0] === 'string' &&
          typeof item[1] === 'number'
        ) {
          sort.push(`${item[0]} ${item[1] > 0 ? 'ASC' : 'DESC'}`)
        }
      })
    }

    if (
      method !== '_getCurrencies' &&
      method !== '_getSymbols'
    ) {
      exclude.push('user_id')
      values['$user_id'] = user._id
      where += `AND user_id = $user_id`
    }

    Object.keys(methodColl.model).forEach(field => {
      if (exclude.every(item => item !== field)) {
        fields.push(field)
      }
    })

    const sql = `SELECT ${fields.join(', ')} FROM ${methodColl.name}
      ${where}
      ORDER BY ${sort.join(', ')}
      LIMIT $limit`

    const _res = await this._all(sql, values)
    let res = this._convertDataType(_res)

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

  _convertDataType (
    arr = [],
    boolFields
  ) {
    arr.forEach(obj => {
      Object.keys(obj).forEach(key => {
        if (
          obj &&
          typeof obj === 'object'
        ) {
          obj[key] = this._deserializeVal(
            obj[key],
            key,
            boolFields
          )
        }
      })
    })

    return arr
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

  async _updateCollBy (name, filter = [], data = {}) {
    const values = {}
    const fields = Object.keys(data).map(item => {
      const key = `$${item}`
      values[key] = data[item]

      return `${item} = ${key}`
    }).join(', ')
    const where = filter.reduce((accum, curr, i) => {
      return `${accum}${i > 0 ? ' AND ' : ''}${curr} = $${curr}`
    }, 'WHERE ')

    const sql = `UPDATE ${name} SET ${fields} ${where}`

    return this._run(sql, values)
  }

  /**
   * @override
   */
  async insertOrUpdateUser (data) {
    const user = await this._getUserByAuth(data)

    if (isEmpty(user)) {
      if (!data.email) {
        throw new Error('ERR_AUTH_UNAUTHORIZED')
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
              'timezone'
            ]
          ),
          active: 1,
          isDataFromDb: 1
        }]
      )
    }

    const newData = {
      _id: user._id,
      active: 1
    }

    refreshObj(
      user,
      newData,
      data,
      ['email', 'timezone']
    )

    const res = await this._updateCollBy('users', ['_id'], newData)

    if (res && res.changes < 1) {
      throw new Error('ERR_AUTH_UNAUTHORIZED')
    }

    return res
  }

  /**
   * @override
   */
  async updateUserByAuth (data) {
    const res = await this._updateCollBy('users', ['apiKey', 'apiSecret'], data)

    if (res && res.changes < 1) {
      throw new Error('ERR_AUTH_UNAUTHORIZED')
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
  getElemsInCollBy (collName) {
    const sql = `SELECT * FROM ${collName}`

    return this._all(sql)
  }

  /**
   * @override
   */
  getElemInCollBy (collName, filter = {}, sort = []) {
    const values = {}

    const _sort = Object.keys(sort).reduce((accum, curr, i) => {
      if (
        Array.isArray(curr) &&
        typeof curr[0] === 'string' &&
        typeof curr[1] === 'number'
      ) {
        accum.push(`${curr[0]} ${curr[1] > 0 ? 'ASC' : 'DESC'}`)
      }
    }, [])

    const where = Object.keys(filter).reduce((accum, curr, i) => {
      const key = `$${curr}`
      values[key] = filter[curr]
      return `${accum}${i > 0 ? ' AND ' : ''}${curr} = ${key}`
    }, 'WHERE ')

    const sql = `SELECT * FROM ${collName}
      ${isEmpty(filter) ? '' : where}
      ${isEmpty(_sort) ? '' : _sort.join(', ')}`

    return this._get(sql, values)
  }

  /**
   * @override
   */
  async removeElemsFromDb (name, auth, data) {
    if (auth) {
      const user = await this.checkAuthInDb({ auth })

      data.forEach(item => {
        item.user_id = user._id
      })
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

    await this._run(sql, values)
  }

  /**
   * @override
   */
  async removeElemsFromDbIfNotInLists (name, lists) {
    const values = {}
    let where = Object.keys(lists).reduce((accum, curr, i) => {
      if (!Array.isArray(lists[curr])) {
        throw new Error('ERR_LIST_IS_NOT_ARRAY')
      }

      let key = '('

      key += lists[curr].map((item, i) => {
        const subKey = `$${curr}_${i}`
        values[subKey] = this._serializeVal(item)

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

    const res = await this._updateCollBy(name, ['_id'], {
      ...data,
      _id: elems[0]._id
    })

    if (res && res.changes < 1) {
      throw new Error(`ERR_CAN_NOT_UPDATE_STATE_OF_${name.toUpperCase()}`)
    }

    return res
  }

  /**
   * @override
   */
  getFirstElemInCollBy (collName, filter = {}) {
    const values = {}
    const where = Object.keys(filter).reduce((accum, curr, i) => {
      const key = `$${curr}`
      values[key] = filter[curr]
      return `${accum}${i > 0 ? ' AND ' : ''}${curr} = ${key}`
    }, 'WHERE ')

    const sql = `SELECT * FROM ${collName} ${isEmpty(filter) ? '' : where}`

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

    const res = await this._updateCollBy(name, ['_id'], {
      ...data,
      _id: elems[0]._id
    })

    if (res && res.changes < 1) {
      throw new Error(`ERR_CAN_NOT_UPDATE_${name.toUpperCase()}`)
    }

    return res
  }
}

module.exports = SqliteDAO
