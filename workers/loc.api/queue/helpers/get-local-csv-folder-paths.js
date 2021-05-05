'use strict'

const path = require('path')
const argv = require('yargs').argv

module.exports = (rootPath) => {
  const localCsvFolderPath = path.isAbsolute(argv.csvFolder)
    ? argv.csvFolder
    : path.join(rootPath, argv.csvFolder)
  const tempCsvFolderPath = path.isAbsolute(argv.tempFolder)
    ? argv.tempFolder
    : path.join(rootPath, argv.tempFolder)

  return {
    localCsvFolderPath,
    tempCsvFolderPath
  }
}
