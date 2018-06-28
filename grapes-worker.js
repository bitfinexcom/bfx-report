'use strict'

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production'

const { fork } = require('child_process')
const path = require('path')
const EventEmitter = require('events')
require('config')

const { bootTwoGrapes, killGrapes } = require('./workers/grenache.helper')

const emitter = new EventEmitter()
let ipc = null
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
  ipc.on('close', () => {
    killGrapes(grapes, () => {
      process.nextTick(() => {
        process.exit(0)
      })
    })
  })
  grapes[0].once('announce', () => {
    emitter.emit('ready:grapes-worker', { ipc, grapes })
  })
})

const _processExit = () => {
  ipc.kill()
}

process.on('SIGINT', () => _processExit())
process.on('SIGHUP', () => _processExit())
process.on('SIGTERM', () => _processExit())

module.exports = {
  ipc,
  grapes,
  emitter
}
