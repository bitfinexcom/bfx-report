'use strict'

const { promisify } = require('util')
const path = require('path')
const fs = require('fs')
const uuidv4 = require('uuid/v4')

const access = promisify(fs.access)
const mkdir = promisify(fs.mkdir)
const readdir = promisify(fs.readdir)

const tempDirPath = path.join(__dirname, 'temp')

const _checkAndCreateDir = async () => {
  try {
    await access(tempDirPath, fs.F_OK)
    return Promise.resolve()
  } catch (err) {
    return mkdir(tempDirPath)
  }
}

const createUniqueFileName = async (count = 0) => {
  count += 1

  if (count > 20) {
    return Promise.reject(new Error('ERR_CREATE_UNIQUE_FILE_NAME'))
  }

  await _checkAndCreateDir()

  const uniqueFileName = `${uuidv4()}.csv`

  const files = await readdir(tempDirPath)

  if (files.some(file => file === uniqueFileName)) {
    return createUniqueFileName(count)
  }

  return Promise.resolve(path.join(tempDirPath, uniqueFileName))
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

const writeDataToStream = stream => {
  const fakeData = {
    id: 1,
    description: 'description',
    otherField: 'other field'
  }

  stream.write(fakeData)
}

module.exports = {
  createUniqueFileName,
  writableToPromise,
  writeDataToStream
}
