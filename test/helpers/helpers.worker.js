'use strict'

const { fork } = require('child_process')
const path = require('path')
const { runWorker } = require('./worker-for-test')

const ipc = []

let wrkReportServiceApi = null

const startHelpers = (
  logs,
  workers = [
    { name: 's3', port: 13371 },
    { name: 'sendgrid', port: 1310 },
    { name: 'testcalls', port: 1300 }
  ]
) => {
  return workers.map(worker => {
    return fork(
      path.join(__dirname, '..', 'simulate/bfx-ext-mockspy-js', 'worker.js'),
      [
        '--env=development',
        '--wtype=wrk-ext-mockspy-api',
        `--apiPort=${worker.port}`,
        `--mockspy=${worker.name}`
      ],
      {
        silent: !logs
      }
    )
  })
}

const startWorkers = (logs, isRootWrk) => {
  if (isRootWrk) {
    const wrkIpc = fork(
      path.join(__dirname, '../..', 'worker.js'),
      [
        '--env=development',
        '--wtype=wrk-report-service-api',
        '--apiPort=1338'
      ],
      {
        silent: !logs
      }
    )

    ipc.push(wrkIpc)
  } else {
    wrkReportServiceApi = runWorker({
      wtype: 'wrk-report-service-api',
      apiPort: 1338
    })
  }

  ipc.push(...startHelpers(logs))

  return {
    wrkReportServiceApi,
    amount: isRootWrk ? ipc.length : ipc.length + 1
  }
}

const closeIpc = (ipc, resolve = (() => { })) => {
  if (ipc.length) {
    const close = ipc.pop()
    close.kill()
    close.on('close', () => {
      closeIpc(ipc, resolve)
    })
  } else {
    resolve()
  }
}

const stopWorkers = () => {
  return new Promise((resolve, reject) => {
    try {
      if (wrkReportServiceApi) {
        wrkReportServiceApi.stop(() => {
          closeIpc(ipc, resolve)
        })
      } else closeIpc(ipc, resolve)
    } catch (e) {
      reject(e)
    }
  })
}

module.exports = {
  stopWorkers,
  startWorkers,
  startHelpers,
  closeIpc
}
