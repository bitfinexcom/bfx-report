'use strict'

const {
  getMethodCollMap,
  getModelsMap
} = require('./../schema')

class DAO {
  constructor (db) {
    this.db = db
  }

  _getModelsMap () {
    return getModelsMap()
  }

  _getMethodCollMap () {
    return getMethodCollMap()
  }

  /**
   * @abstract
   */
  async databaseInitialize () { throw new Error('NOT_IMPLEMENTED') }

  /**
   * @abstract
   */
  async checkAuthInDb () { throw new Error('NOT_IMPLEMENTED') }

  /**
   * @abstract
   */
  async findInCollBy () { throw new Error('NOT_IMPLEMENTED') }

  /**
   * @abstract
   */
  async insertOrUpdateUser () { throw new Error('NOT_IMPLEMENTED') }

  /**
   * @abstract
   */
  async deactivateUser () { throw new Error('NOT_IMPLEMENTED') }

  /**
   * @abstract
   */
  async removeElemsFromDb () { throw new Error('NOT_IMPLEMENTED') }

  /**
   * @abstract
   */
  async updateStateOf () { throw new Error('NOT_IMPLEMENTED') }

  /**
   * @abstract
   */
  async getFirstElemInCollBy () { throw new Error('NOT_IMPLEMENTED') }
}

module.exports = DAO
