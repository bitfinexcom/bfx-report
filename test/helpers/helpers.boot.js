'use strict'

const {
  stopWorkers,
  startWorkers: _startWorkers
} = require('./helpers.worker')
const {
  bootTwoGrapes,
  killGrapes
} = require('./helpers.grape')

const grapes = []

const startEnvironment = async (
  logs = false,
  isForkWrk = false,
  countWrk = 1,
  conf = {},
  serviceRoot,
  isNotStartedEnv,
  startWorkers = _startWorkers
) => {
  let count = 0

  if (!isNotStartedEnv) {
    const _grapes = await bootTwoGrapes()

    grapes.push(..._grapes)
  }

  const {
    wrkIpcs,
    wrksReportServiceApi,
    amount
  } = startWorkers(
    logs,
    isForkWrk,
    countWrk,
    conf,
    serviceRoot,
    isNotStartedEnv
  )

  return isNotStartedEnv
    ? {
        wrkIpcs,
        wrksReportServiceApi
      }
    : new Promise((resolve, reject) => {
      const [grape1] = grapes

      grape1.on('announce', () => {
        count += 1

        const timeout = setTimeout(reject, 5000)

        if (count === amount) {
          clearTimeout(timeout)
          resolve({
            wrkIpcs,
            wrksReportServiceApi
          })
        }
      })
    })
}

const stopEnvironment = async () => {
  await stopWorkers()
  await killGrapes(grapes)

  grapes.splice(0, grapes.length)
}

module.exports = {
  startEnvironment,
  stopEnvironment
}
