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
const getReportFileExtName = require('./get-report-file-ext-name')
const getReportContentType = require('./get-report-content-type')

module.exports = {
  moveFileToLocalStorage,
  writableToPromise,
  createUniqueFileName,
  getCompleteFileName,
  getLocalReportFolderPaths,
  getReportFileExtName,
  getReportContentType
}
