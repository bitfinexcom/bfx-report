'use strict'

const MediatorReportService = require('./service.report.mediator')
const SqliteDAO = require('./sync/dao/dao.sqlite')

class SqliteReportService extends MediatorReportService {
  /**
   * @override
   */
  _databaseInitialize () {
    const db = this.ctx.dbSqlite_m0.db
    this.dao = new SqliteDAO(db)
    return this.dao.databaseInitialize()
  }
}

module.exports = SqliteReportService
