'use strict'

const {
  getMethodCollMap,
  getModelsMap
} = require('./../schema')
const { ImplementationError } = require('../../errors')

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
  async databaseInitialize () { throw new ImplementationError() }

  /**
   * @abstract
   */
  async getLastElemFromDb () { throw new ImplementationError() }

  /**
   * @abstract
   */
  async insertElemsToDb () { throw new ImplementationError() }

  /**
   * @abstract
   */
  async checkAuthInDb () { throw new ImplementationError() }

  /**
   * @abstract
   */
  async findInCollBy () { throw new ImplementationError() }

  /**
   * @abstract
   */
  async getActiveUsers () { throw new ImplementationError() }

  /**
   * @abstract
   */
  async updateElemsInCollBy () { throw new ImplementationError() }

  /**
   * @abstract
   */
  async updateCollBy () { throw new ImplementationError() }

  /**
   * @abstract
   */
  async insertOrUpdateUser () { throw new ImplementationError() }

  /**
   * @abstract
   */
  async updateUserByAuth () { throw new ImplementationError() }

  /**
   * @abstract
   */
  async deactivateUser () { throw new ImplementationError() }

  /**
   * @abstract
   */
  async getElemsInCollBy () { throw new ImplementationError() }

  /**
   * @abstract
   */
  async getElemInCollBy () { throw new ImplementationError() }

  /**
   * @abstract
   */
  async removeElemsFromDb () { throw new ImplementationError() }

  /**
   * @abstract
   */
  async updateStateOf () { throw new ImplementationError() }

  /**
   * @abstract
   */
  async getFirstElemInCollBy () { throw new ImplementationError() }

  /**
   * @abstract
   */
  async updateProgress () { throw new ImplementationError() }

  /**
   * @abstract
   */
  async insertElemsToDbIfNotExists () { throw new ImplementationError() }

  /**
   * @abstract
   */
  async removeElemsFromDbIfNotInLists () { throw new ImplementationError() }

  /**
   * @abstract
   */
  async getCountBy () { throw new ImplementationError() }
}

module.exports = DAO
