'use strict'

require('colors')

const {
  startHelpers,
  closeIpc
} = require('../helpers/helpers.worker')
const {
  bootTwoGrapes,
  killGrapes
} = require('../helpers/helpers.grape')

let count = 0
const grapes = []
let ipcs = []

const _processExit = async () => {
  await closeIpc(ipcs)
  await killGrapes(grapes)

  process.exit()
}

process.on('SIGINT', _processExit)
process.on('SIGHUP', _processExit)
process.on('SIGTERM', _processExit)

void (async () => {
  try {
    console.log('[WAIT]'.yellow)

    const _grapes = await bootTwoGrapes()
    const [grape1, grape2] = _grapes
    grapes.push(..._grapes)

    grape1.on('error', (err) => {
      console.error('[ERR]: '.red, err.toString().red)
    })
    grape2.on('error', (err) => {
      console.error('[ERR]: '.red, err.toString().red)
    })

    ipcs = startHelpers(true)

    await new Promise((resolve, reject) => {
      grape1.once('error', reject)
      grape1.once('announce', () => {
        count += 1

        if (count === 4) {
          grape1.removeListener('error', reject)
          resolve()

          console.log('[READY]'.green)
        }
      })
    })
  } catch (err) {
    console.error('[ERR]: '.red, err.toString().red)
  }
})()
