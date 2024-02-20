'use strict'

const path = require('path')
const argv = require('yargs').argv

module.exports = (rootPath) => {
  const localReportFolderPath = path.isAbsolute(argv.reportFolder)
    ? argv.reportFolder
    : path.join(rootPath, argv.reportFolder)
  const tempReportFolderPath = path.isAbsolute(argv.tempFolder)
    ? argv.tempFolder
    : path.join(rootPath, argv.tempFolder)

  return {
    localReportFolderPath,
    tempReportFolderPath
  }
}
