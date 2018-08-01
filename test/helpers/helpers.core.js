'use strict'

const { promisify } = require('util')
const path = require('path')
const fs = require('fs')
const config = require('config')

const readdir = promisify(fs.readdir)
const unlink = promisify(fs.unlink)

const checkConfAuth = () => {
  if (
    config.has('auth') &&
    config.has('auth.apiKey') &&
    typeof config.get('auth.apiKey') === 'string' &&
    config.get('auth.apiKey') &&
    config.has('auth.apiSecret') &&
    typeof config.get('auth.apiSecret') === 'string' &&
    config.get('auth.apiSecret')
  ) {
    return
  }

  const err = new Error('ERR_CONFIG_ARGS_NO_AUTH')

  throw err
}

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
  checkConfAuth,
  cleanJobs,
  rmAllFiles,
  queueToPromise
}
