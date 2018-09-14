'use strict'

const { isEmpty } = require('lodash')

const DAO = require('./dao')
const { checkParamsAuth } = require('../../helpers')

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

      if (item.type === 'array:object') {
        let sql = `CREATE INDEX IF NOT EXISTS ${item.name}_${item.dateFieldName}_${item.symbolFieldName}
          ON ${item.name}(${item.dateFieldName}, ${item.symbolFieldName})`

        await this._run(sql)
      }
    }
  }

  /**
   * @override
   */
  async getLastElemFromDb (name, auth, dateFieldName) {
    const sql = `SELECT ${name}.* FROM ${name}
      INNER JOIN users ON users._id = ${name}.user_id
      WHERE users.apiKey = $apiKey
      AND users.apiSecret = $apiSecret
      ORDER BY ${dateFieldName} DESC`

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

            if (typeof obj[item] === 'boolean') {
              values[key] = +obj[item]
            } else if (typeof obj[item] === 'object') {
              values[key] = JSON.stringify(obj[item])
            } else {
              values[key] = obj[item]
            }

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
  async checkAuthInDb (args) {
    checkParamsAuth(args)

    const user = await this._getUserByAuth(args.auth)

    if (isEmpty(user) || !user.active) {
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

    if (res && typeof res.active === 'boolean') {
      res.active = !!res.active
    }

    return res
  }

  /**
   * @override
   */
  async findInCollBy () {}

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
      return this.insertElemsToDb(
        'users',
        null,
        [{
          email: data.email,
          apiKey: data.apiKey,
          apiSecret: data.apiSecret,
          active: 1
        }]
      )
    }

    const newData = {
      _id: user._id,
      active: 1
    }

    if (user.email !== data.email) {
      newData.email = data.email
    }

    const res = await this._updateCollBy('users', ['_id'], newData)

    if (res && res.changes < 1) {
      throw new Error('ERR_AUTH_UNAUTHORIZED')
    }

    return res
  }

  /**
   * @override
   */
  async deactivateUser () {}

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
  async updateStateOf () {}

  /** // TODO: Dummy data
   * @override
   */
  async getFirstElemInCollBy () {
    return { isEnable: true }
  }
}

module.exports = SqliteDAO
