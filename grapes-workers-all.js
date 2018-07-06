'use strict'

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production'

const { fork } = require('child_process')
const path = require('path')
const EventEmitter = require('events')
require('config')

const { bootTwoGrapes, killGrapes } = require('./workers/grenache.helper')

const emitter = new EventEmitter()
let ipc = null
let ipcS3 = null
let ipcSendgrid = null
let grapes = null

bootTwoGrapes((err, g) => {
  if (err) throw err

  grapes = g

  const modulePath = path.join(__dirname, 'worker.js')

  ipc = fork(modulePath, [
    `--env=${process.env.NODE_ENV}`,
    '--wtype=wrk-report-service-api',
    '--apiPort=1337'
  ], {
    cwd: process.cwd(),
    stdio: ['inherit', 'inherit', 'inherit', 'ipc']
  })
  ipcS3 = fork(modulePath, [
    `--env=${process.env.NODE_ENV}`,
    '--wtype=wrk-ext-s3-api',
    '--apiPort=1338'
  ], {
    cwd: process.cwd(),
    stdio: ['inherit', 'inherit', 'inherit', 'ipc']
  })
  ipcSendgrid = fork(modulePath, [
    `--env=${process.env.NODE_ENV}`,
    '--wtype=wrk-ext-sendgrid-api',
    '--apiPort=1339'
  ], {
    cwd: process.cwd(),
    stdio: ['inherit', 'inherit', 'inherit', 'ipc']
  })
  ipc.on('close', () => {
    killGrapes(grapes, () => {
      process.nextTick(() => {
        process.exit(0)
      })
    })
  })
  ipcS3.on('close', () => {
    process.nextTick(() => {
      ipc.kill()
    })
  })
  ipcSendgrid.on('close', () => {
    process.nextTick(() => {
      ipcS3.kill()
    })
  })
  grapes[0].once('announce', () => {
    emitter.emit('ready:grapes-worker', { ipc, grapes })
  })
})

const _processExit = () => {
  ipcSendgrid.kill()
}

process.on('SIGINT', () => _processExit())
process.on('SIGHUP', () => _processExit())
process.on('SIGTERM', () => _processExit())

module.exports = {
  ipc,
  grapes,
  emitter
}
