'use strict'

const fs = require('fs')
const { stringify } = require('csv')

const {
  createUniqueFileName,
  writableToPromise,
  writeDataToStream
} = require('./helpers')

module.exports = async job => {
  try {
    const filePath = await createUniqueFileName()

    const writable = fs.createWriteStream(filePath)
    const writablePromise = writableToPromise(writable)
    const stringifier = stringify({
      header: true,
      columns: {
        id: 'ID',
        description: 'Description'
      }
    })

    stringifier.pipe(writable)
    writeDataToStream(stringifier)
    stringifier.end()

    await writablePromise

    return Promise.resolve({
      filePath
    })
  } catch (err) {
    return Promise.reject(err)
  }
}
