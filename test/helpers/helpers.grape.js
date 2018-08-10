'use strict'

const { Grape } = require('grenache-grape')
const waterfall = require('async/waterfall')

const confGrape1 = {
  dht_port: 20002,
  dht_bootstrap: ['127.0.0.1:20001'],
  api_port: 40001
}
const confGrape2 = {
  dht_port: 20001,
  dht_bootstrap: ['127.0.0.1:20002'],
  api_port: 30001
}

const bootTwoGrapes = cb => {
  const grape1 = new Grape(confGrape1)
  const grape2 = new Grape(confGrape2)

  waterfall(
    [
      cb => {
        grape1.start()
        grape1.once('ready', cb)
      },
      cb => {
        grape2.start()
        grape2.once('node', cb)
      }
    ],
    () => {
      cb(null, [grape1, grape2])
    }
  )
}

const killGrapes = (grapes, done = () => {}) => {
  grapes[0].stop(err => {
    if (err) throw err
    grapes[1].stop(err => {
      if (err) throw err
      done()
    })
  })
}

module.exports = {
  bootTwoGrapes,
  killGrapes
}
