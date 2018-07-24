'use strict'

const { promisify } = require('util')
const path = require('path')
const fs = require('fs')
const { stringify } = require('csv')
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

const _createUniqueFileName = async (count = 0) => {
  count += 1

  if (count > 20) {
    return Promise.reject(new Error('ERR_CREATE_UNIQUE_FILE_NAME'))
  }

  const uniqueFileName = `${uuidv4()}.csv`

  const files = await readdir(tempDirPath)

  if (files.some(file => file === uniqueFileName)) {
    return _createUniqueFileName(count)
  }

  return Promise.resolve(path.join(tempDirPath, uniqueFileName))
}

const _writableToPromise = stream => {
  return new Promise((resolve, reject) => {
    stream.once('finish', () => {
      resolve('finish')
    })
    stream.once('error', err => {
      reject(err)
    })
  })
}

const _writeDataToStream = stream => {
  const fakeData = {
    id: 1,
    description: 'description',
    otherField: 'other field'
  }

  stream.write(fakeData)
}

module.exports = async job => {
  try {
    await _checkAndCreateDir()
    const filePath = await _createUniqueFileName()

    const writable = fs.createWriteStream(filePath)
    const writablePromise = _writableToPromise(writable)
    const stringifier = stringify({
      header: true,
      columns: {
        id: 'ID',
        description: 'Description'
      }
    })

    stringifier.pipe(writable)
    _writeDataToStream(stringifier)
    stringifier.end()

    await writablePromise

    return Promise.resolve({
      filePath
    })
  } catch (err) {
    return Promise.reject(err)
  }
}
