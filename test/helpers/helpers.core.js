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

module.exports = {
  cleanJobs,
  rmAllFiles,
  queueToPromise
}
