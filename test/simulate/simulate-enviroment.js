'use strict'

require('colors')

const { startHelpers, closeIpc } = require('../helpers/helpers.worker')
const { bootTwoGrapes } = require('../helpers/helpers.grape')

let count = 0
let ipc = []

console.log('Wait till ready'.yellow)

const _processExit = () => {
  closeIpc(ipc, process.exit)
}

process.on('SIGINT', _processExit)
process.on('SIGHUP', () => _processExit)
process.on('SIGTERM', () => _processExit)

bootTwoGrapes((err, g) => {
  if (err) throw err

  ipc = startHelpers(true)

  const grapes = g

  grapes[0].on('announce', async () => {
    count += 1

    if (count === 3) {
      try {
        console.log('Ready!!'.green)
      } catch (e) {
        console.log('Error: '.red, e.toString().red)
      }
    }
  })
})
