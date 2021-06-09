'use strict'

const { promisify } = require('util')
const path = require('path')
const fs = require('fs')

const readdir = promisify(fs.readdir)
const unlink = promisify(fs.unlink)
const mkdir = promisify(fs.mkdir)

const rmDB = async (
  dir,
  exclude = ['.gitkeep'],
  isThrownError
) => {
  try {
    const files = await readdir(dir)
    const promisesArr = files.map((file) => {
      if (exclude.every(exFile => exFile !== file)) {
        return unlink(path.join(dir, file))
      }

      return null
    })

    const res = await Promise.all(promisesArr)

    return res
  } catch (err) {
    if (!isThrownError) {
      return
    }

    throw err
  }
}

const rmAllFiles = async (dir, exclude) => {
  try {
    await rmDB(dir, exclude, true)
  } catch (err) {
    if (err.syscall === 'scandir') {
      await mkdir(dir)
    }
  }
}

const queueToPromise = (queue) => {
  return new Promise((resolve, reject) => {
    queue.once('error:base', reject)
    queue.once('completed', res => {
      queue.removeListener('error:base', reject)
      resolve(res)
    })
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
        queue.removeListener('error:base', reject)
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
          queue.removeListener('error:base', reject)
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

const ipcsToPromiseMulti = (name, ipcs, count, cb = () => { }) => {
  return new Promise((resolve, reject) => {
    let currCount = 0

    const onCompleted = ({
      action = 'completed',
      result
    }) => {
      if (`${name}:error` === action) {
        reject(result)

        return
      }
      if (`${name}:completed` !== action) {
        return
      }

      currCount += 1

      try {
        cb(result)
      } catch (err) {
        reject(err)
      }

      if (currCount >= count) {
        ipcs.forEach(ipc => {
          ipc.removeListener('message', onCompleted)
          ipc.removeListener('error', reject)
        })

        resolve()
      }
    }

    ipcs.forEach(ipc => {
      ipc.once('error', reject)
      ipc.on('message', onCompleted)
    })
  })
}

module.exports = {
  rmDB,
  rmAllFiles,
  queueToPromise,
  queueToPromiseMulti,
  queuesToPromiseMulti,
  ipcsToPromiseMulti
}
