'use strict'

const { promisify } = require('util')
const path = require('path')
const fs = require('fs')
const uuidv4 = require('uuid/v4')
const argv = require('yargs').argv

const mkdir = promisify(fs.mkdir)
const readdir = promisify(fs.readdir)
const access = promisify(fs.access)
const chmod = promisify(fs.chmod)
const rename = promisify(fs.rename)

const isElectronjsEnv = argv.isElectronjsEnv

const getCompleteFileName = require('./get-complete-file-name')

const _checkAndCreateDir = async (dirPath) => {
  const basePath = path.join(dirPath, '..')

  try {
    await access(dirPath, fs.constants.F_OK | fs.constants.W_OK)
  } catch (err) {
    if (err.code === 'EACCES' && !isElectronjsEnv) throw err
    if (err.code === 'ENOENT') {
      try {
        await access(basePath, fs.constants.F_OK | fs.constants.W_OK)
      } catch (errBasePath) {
        if (errBasePath.code === 'EACCES' && isElectronjsEnv) {
          await chmod(basePath, '766')
        } else throw errBasePath
      }

      await mkdir(dirPath)
    }

    if (isElectronjsEnv) await chmod(dirPath, '766')
  }
}

const moveFileToLocalStorage = async (
  rootPath,
  filePath,
  name,
  params,
  userInfo,
  isAddedUniqueEndingToCsvName
) => {
  const localStorageDirPath = path.isAbsolute(argv.csvFolder)
    ? argv.csvFolder
    : path.join(rootPath, argv.csvFolder)

  await _checkAndCreateDir(localStorageDirPath)

  let fileName = getCompleteFileName(
    name,
    params,
    { userInfo }
  )

  try {
    await access(filePath, fs.constants.F_OK | fs.constants.W_OK)
  } catch (err) {
    if (err.code === 'EACCES' && isElectronjsEnv) {
      await chmod(filePath, '766')
    } else throw err
  }

  const files = await readdir(localStorageDirPath)
  let count = 0

  while (files.some(file => file === fileName)) {
    count += 1

    fileName = getCompleteFileName(
      name,
      params,
      {
        userInfo,
        isAddedUniqueEndingToCsvName,
        uniqEnding: `(${count})`
      }
    )
  }

  const newFilePath = path.join(localStorageDirPath, fileName)
  await rename(filePath, newFilePath)

  if (isElectronjsEnv) {
    await chmod(newFilePath, '766')
  }
}

const createUniqueFileName = async (rootPath, count = 0) => {
  count += 1

  if (count > 20) {
    throw new Error('ERR_CREATE_UNIQUE_FILE_NAME')
  }

  const tempDirPath = path.isAbsolute(argv.tempFolder)
    ? argv.tempFolder
    : path.join(rootPath, argv.tempFolder)

  await _checkAndCreateDir(tempDirPath)

  const uniqueFileName = `${uuidv4()}.csv`

  const files = await readdir(tempDirPath)

  if (files.some(file => file === uniqueFileName)) {
    return createUniqueFileName(rootPath, count)
  }

  return path.join(tempDirPath, uniqueFileName)
}

const writableToPromise = stream => {
  return new Promise((resolve, reject) => {
    stream.once('finish', () => {
      resolve('finish')
    })
    stream.once('error', err => {
      reject(err)
    })
  })
}

module.exports = {
  moveFileToLocalStorage,
  writableToPromise,
  createUniqueFileName
}
