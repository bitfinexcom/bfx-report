'use strict'

const { promisify } = require('util')
const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const argv = require('yargs').argv

const mkdir = promisify(fs.mkdir)
const readdir = promisify(fs.readdir)
const access = promisify(fs.access)
const chmod = promisify(fs.chmod)

const isElectronjsEnv = argv.isElectronjsEnv

const getCompleteFileName = require('./get-complete-file-name')
const getLocalReportFolderPaths = require(
  './get-local-report-folder-paths'
)
const getReportFileExtName = require('./get-report-file-ext-name')

const _checkAndCreateDir = async (dirPath) => {
  try {
    await access(dirPath, fs.constants.F_OK | fs.constants.W_OK)
  } catch (err) {
    if (err.code === 'ENOENT') {
      await mkdir(dirPath, { recursive: true })

      if (isElectronjsEnv) {
        await chmod(dirPath, '766')
      }

      return
    }
    if (
      err.code === 'EACCES' &&
      isElectronjsEnv
    ) {
      await chmod(dirPath, '766')

      return
    }

    throw err
  }
}

const _moveFileAcrossDevice = (src, dest) => {
  return new Promise((resolve, reject) => {
    const inStream = fs.createReadStream(src)
    const outStream = fs.createWriteStream(dest)

    const onFinish = (err) => {
      const path = err ? dest : src

      fs.unlink(path, (unlinkErr) => {
        if (err || unlinkErr) {
          return reject(err || unlinkErr)
        }

        resolve()
      })
    }
    const onError = (err) => {
      inStream.destroy()
      outStream.destroy()
      outStream.removeListener('finish', onFinish)

      onFinish(err)
    }

    inStream.once('error', onError)
    outStream.once('error', onError)
    outStream.once('finish', onFinish)

    inStream.pipe(outStream)
  })
}

const moveFileToLocalStorage = async (
  rootPath,
  filePath,
  name,
  params,
  userInfo,
  isAddedUniqueEndingToReportFileName,
  chunkCommonFolder
) => {
  const { localReportFolderPath } = getLocalReportFolderPaths(rootPath)
  const fullReportDirPath = (
    chunkCommonFolder &&
    typeof chunkCommonFolder === 'string'
  )
    ? path.join(localReportFolderPath, chunkCommonFolder)
    : localReportFolderPath

  await _checkAndCreateDir(fullReportDirPath)

  let { fileName } = getCompleteFileName(
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

  const files = await readdir(fullReportDirPath)
  let count = 0

  while (files.some(file => file === fileName)) {
    count += 1

    fileName = getCompleteFileName(
      name,
      params,
      {
        userInfo,
        isAddedUniqueEndingToReportFileName,
        uniqEnding: `(${count})`
      }
    ).fileName
  }

  const newFilePath = path.join(fullReportDirPath, fileName)
  await _moveFileAcrossDevice(filePath, newFilePath)

  if (isElectronjsEnv) {
    await chmod(newFilePath, '766')
  }

  return { newFilePath }
}

const createUniqueFileName = async (rootPath, params, count = 0) => {
  count += 1

  if (count > 20) {
    throw new Error('ERR_CREATE_UNIQUE_FILE_NAME')
  }

  const { tempReportFolderPath } = getLocalReportFolderPaths(rootPath)

  await _checkAndCreateDir(tempReportFolderPath)

  const ext = getReportFileExtName(params)
  const uniqueFileName = `${uuidv4()}.${ext}`

  const files = await readdir(tempReportFolderPath)

  if (files.some(file => file === uniqueFileName)) {
    return createUniqueFileName(rootPath, params, count)
  }

  return path.join(tempReportFolderPath, uniqueFileName)
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
