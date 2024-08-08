'use strict'

const path = require('path')

const {
  readdir,
  mkdir,
  rm
} = require('node:fs/promises')

const rmDB = async (
  dir,
  exclude = ['.gitkeep']
) => {
  try {
    const files = await readdir(
      dir,
      { withFileTypes: true }
    )

    for (const dirent of files) {
      const { name } = dirent

      if (
        !dirent.isFile() ||
        exclude.some((exFile) => exFile === name)
      ) {
        continue
      }

      const filePath = path.join(dir, name)
      await rm(
        filePath,
        {
          force: true,
          maxRetries: 5,
          recursive: true,
          retryDelay: 200
        }
      )
    }
  } catch (err) {
    console.log(err)
  }
}

const rmAllFiles = async (dir, exclude) => {
  try {
    await rmDB(dir, exclude)
    await mkdir(dir, { recursive: true })
  } catch (err) {
    console.log(err)
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
