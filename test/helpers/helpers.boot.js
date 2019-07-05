'use strict'

const {
  stopWorkers,
  startWorkers
} = require('./helpers.worker')
const {
  bootTwoGrapes,
  killGrapes
} = require('./helpers.grape')

const grapes = []

const startEnviroment = async (
  logs = false,
  isRootWrk = false,
  countWrk = 1,
  conf = {},
  serviceRoot
) => {
  let count = 0

  const _grapes = await bootTwoGrapes()
  const [grape1] = _grapes
  grapes.push(..._grapes)

  const {
    wrksReportServiceApi,
    amount
  } = startWorkers(
    logs,
    isRootWrk,
    countWrk,
    conf,
    serviceRoot
  )

  return new Promise((resolve, reject) => {
    grape1.on('announce', () => {
      count += 1

      const timeout = setTimeout(reject, 5000)

      if (count === amount) {
        clearTimeout(timeout)
        resolve({ wrksReportServiceApi })
      }
    })
  })
}

const stopEnviroment = async () => {
  await stopWorkers()
  await killGrapes(grapes)
}

module.exports = {
  startEnviroment,
  stopEnviroment
}
