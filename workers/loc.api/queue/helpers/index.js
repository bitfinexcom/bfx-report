'use strict'

const getCompleteFileName = require('./get-complete-file-name')
const {
  moveFileToLocalStorage,
  writableToPromise,
  createUniqueFileName,
  getReportFileExtName
} = require('./utils')
const getLocalReportFolderPaths = require(
  './get-local-report-folder-paths'
)

module.exports = {
  moveFileToLocalStorage,
  writableToPromise,
  createUniqueFileName,
  getReportFileExtName,
  getCompleteFileName,
  getLocalReportFolderPaths
}
