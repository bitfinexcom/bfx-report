'use strict'

const DAO = require('./dao')

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
  async databaseInitialize () {}

  /**
   * @override
   */
  async checkAuthInDb () {}

  /**
   * @override
   */
  async insertOrUpdateUser () {}

  /**
   * @override
   */
  async deactivateUser () {}

  /**
   * @override
   */
  async removeElemsFromDb () {}

  /**
   * @override
   */
  async updateStateOf () {}

  /**
   * @override
   */
  async getFirstElemInCollBy () {}
}

module.exports = SqliteDAO
