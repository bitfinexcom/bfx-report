'use strict'

const path = require('node:path')
const {
  readdir,
  mkdir,
  rm
} = require('node:fs/promises')

const QUEUE_EVENT_NAMES = require(
  '../../workers/loc.api/queue/queue.event.names'
)

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
    queue.once(QUEUE_EVENT_NAMES.ERROR_BASE, reject)
    queue.once(QUEUE_EVENT_NAMES.COMPLETED, res => {
      queue.removeListener(QUEUE_EVENT_NAMES.ERROR_BASE, reject)
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
        queue.removeListener(QUEUE_EVENT_NAMES.COMPLETED, onCompleted)
        queue.removeListener(QUEUE_EVENT_NAMES.ERROR_BASE, reject)
        resolve()
      }
    }

    queue.once(QUEUE_EVENT_NAMES.ERROR_BASE, reject)
    queue.on(QUEUE_EVENT_NAMES.COMPLETED, onCompleted)
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
          queue.removeListener(QUEUE_EVENT_NAMES.COMPLETED, onCompleted)
          queue.removeListener(QUEUE_EVENT_NAMES.ERROR_BASE, reject)
        })

        resolve()
      }
    }

    queues.forEach(queue => {
      queue.once(QUEUE_EVENT_NAMES.ERROR_BASE, reject)
      queue.on(QUEUE_EVENT_NAMES.COMPLETED, onCompleted)
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
