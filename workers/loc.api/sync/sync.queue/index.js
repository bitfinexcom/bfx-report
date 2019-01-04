'use strict'

const SyncQueue = require('./sync.queue')

const syncQueue = new SyncQueue('syncQueue')

module.exports = syncQueue

module.exports.injectDeps = (rService) => {
  syncQueue.setReportService(rService)
  syncQueue.setDao(rService.dao)
}
