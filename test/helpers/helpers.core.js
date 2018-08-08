'use strict'

const { promisify } = require('util')
const path = require('path')
const fs = require('fs')

const readdir = promisify(fs.readdir)
const unlink = promisify(fs.unlink)
const mkdir = promisify(fs.mkdir)

const rmDB = async (queue) => {
  const path = queue.opts.name

  try {
    await unlink(path)
  } catch (err) { }

  return Promise.resolve()
}

const rmAllFiles = async (dir) => {
  try {
    const files = await readdir(dir)
    const promisesArr = files.map(file => unlink(path.join(dir, file)))

    return Promise.all(promisesArr)
  } catch (err) {
    await mkdir(dir)

    return Promise.resolve()
  }
}

const queueToPromise = (queue) => {
  return new Promise((resolve, reject) => {
    queue.once('error:base', reject)
    queue.once('completed', resolve)
  })
}

const queueToPromiseMulti = (queue, count, cb = () => { }) => {
  return new Promise((resolve, reject) => {
    let currCount = 0

    const onCompleted = (result) => {
      currCount += 1

      try {
        cb(result)
      } catch (err) {
        reject(err)
      }

      if (currCount >= count) {
        queue.removeListener('completed', onCompleted)
        resolve()
      }
    }

    queue.once('error:base', reject)
    queue.on('completed', onCompleted)
  })
}

const queuesToPromiseMulti = (queues, count, cb = () => { }) => {
  return new Promise((resolve, reject) => {
    let currCount = 0

    const onCompleted = (result) => {
      currCount += 1

      try {
        cb(result)
      } catch (err) {
        reject(err)
      }

      if (currCount >= count) {
        queues.forEach(queue => {
          queue.removeListener('completed', onCompleted)
        })

        resolve()
      }
    }

    queues.forEach(queue => {
      queue.once('error:base', reject)
      queue.on('completed', onCompleted)
    })
  })
}

const delay = (mc = 100) => {
  return new Promise((resolve) => {
    setTimeout(resolve, mc)
  })
}

module.exports = {
  rmDB,
  rmAllFiles,
  queueToPromise,
  queueToPromiseMulti,
  queuesToPromiseMulti,
  delay
}
