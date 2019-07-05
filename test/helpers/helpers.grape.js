'use strict'

const { Grape } = require('grenache-grape')

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

const bootTwoGrapes = async () => {
  const grape1 = new Grape(confGrape1)
  const grape2 = new Grape(confGrape2)

  await new Promise((resolve, reject) => {
    grape1.start()
    grape1.once('error', reject)
    grape1.once('ready', (res) => {
      grape1.removeListener('error', reject)
      resolve(res)
    })
  })
  await new Promise((resolve, reject) => {
    grape2.start()
    grape2.once('error', reject)
    grape2.once('node', (res) => {
      grape2.removeListener('error', reject)
      resolve(res)
    })
  })

  return [grape1, grape2]
}

const killGrapes = (grapes = []) => {
  return grapes.reduce(async (accum, grape) => {
    await accum

    return new Promise((resolve, reject) => {
      grape.stop((err) => {
        if (err) {
          reject(err)

          return
        }

        resolve()
      })
    })
  }, Promise.resolve())
}

module.exports = {
  bootTwoGrapes,
  killGrapes
}
