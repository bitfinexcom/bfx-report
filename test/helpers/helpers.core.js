'use strict'

const { promisify } = require('util')
const path = require('path')
const fs = require('fs')

const readdir = promisify(fs.readdir)
const unlink = promisify(fs.unlink)

const cleanJobs = async (
  queue,
  status = ['completed', 'active', 'failed', 'wait', 'delayed']
) => {
  const promisesArr = status.map(item => queue.clean(0, item))

  return Promise.all(promisesArr)
}

const rmAllFiles = async (dir) => {
  const files = await readdir(dir)
  const promisesArr = files.map(file => unlink(path.join(dir, file)))

  return Promise.all(promisesArr)
}

const queueToPromise = (queue) => {
  return new Promise((resolve, reject) => {
    queue.once('failed', (job, err) => {
      reject(err)
    })
    queue.once('error', (err) => {
      reject(err)
    })
    queue.once('completed', (job, result) => {
      resolve(result)
    })
  })
}

const queueToPromiseMulti = (queue, count, cb = () => { }) => {
  return new Promise((resolve, reject) => {
    let currCount = 0

    const onCompleted = (job, result) => {
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

    queue.once('failed', (job, err) => {
      reject(err)
    })
    queue.once('error', (err) => {
      reject(err)
    })
    queue.on('completed', onCompleted)
  })
}

const queuesToPromiseMulti = (queues, count, cb = () => { }) => {
  return new Promise((resolve, reject) => {
    let currCount = 0

    const onCompleted = (job, result) => {
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
      queue.once('failed', (job, err) => {
        reject(err)
      })
      queue.once('error', (err) => {
        reject(err)
      })
      queue.on('completed', onCompleted)
    })
  })
}

const asyncForEach = async (arr, cb) => {
  for (let i = 0; i < arr.length; i += 1) {
    await cb(arr[i], i, arr)
  }
}

const delay = (mc = 1000) => {
  return new Promise((resolve) => {
    setTimeout(resolve, mc)
  })
}

module.exports = {
  cleanJobs,
  rmAllFiles,
  queueToPromise,
  queueToPromiseMulti,
  queuesToPromiseMulti,
  asyncForEach,
  delay
}
