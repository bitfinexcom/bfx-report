'use strict'

const getCompleteFileName = require('./get-complete-file-name')
const {
  moveFileToLocalStorage,
  writableToPromise,
  createUniqueFileName
} = require('./utils')
const getLocalReportFolderPaths = require(
  './get-local-report-folder-paths'
)

module.exports = {
  moveFileToLocalStorage,
  writableToPromise,
  createUniqueFileName,
  getCompleteFileName,
  getLocalReportFolderPaths
}
