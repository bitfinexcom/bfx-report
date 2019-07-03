'use strict'

const { fork } = require('child_process')
const path = require('path')
const worker = require('bfx-svc-boot-js/lib/worker')

const _serviceRoot = path.join(__dirname, '../..')

const ipc = []

let wrksReportServiceApi = []

const startHelpers = (
  logs,
  workers = [
    { name: 's3', port: 13371 },
    { name: 'sendgrid', port: 1310 },
    { name: 'gpg', port: 1320 },
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

const startWorkers = (
  logs,
  isForkWrk,
  countWrk = 1,
  conf = {},
  serviceRoot = _serviceRoot
) => {
  const _conf = {
    env: 'development',
    wtype: 'wrk-report-service-api',
    apiPort: 13381,
    wsPort: 23381,
    dbId: 1,
    syncMode: false,
    isSpamRestrictionMode: false,
    ...conf
  }
  for (let i = 0; i < countWrk; i += 1) {
    if (isForkWrk) {
      const args = Object.keys(_conf).map(key => `--${key}=${_conf[key]}`)

      const wrkIpc = fork(
        path.join(serviceRoot, 'worker.js'),
        args,
        {
          silent: !logs
        }
      )

      ipc.push(wrkIpc)
    } else {
      const wrk = worker({
        ..._conf,
        serviceRoot
      })

      wrksReportServiceApi.push(wrk)
    }

    _conf.apiPort += 1
    _conf.wsPort += 1
    _conf.dbId += 1
  }

  const helperWrks = startHelpers(logs)

  const serviceWrksAmount = isForkWrk
    ? ipc.length
    : wrksReportServiceApi.length
  const helperWrksAmount = helperWrks.length

  ipc.push(...helperWrks)

  return {
    wrksReportServiceApi,
    amount: serviceWrksAmount * 2 + helperWrksAmount
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

const closeWrks = (wrks, resolve = (() => { })) => {
  if (wrks.length) {
    const close = wrks.pop()
    close.stop(() => {
      closeWrks(wrks, resolve)
    })
  } else {
    resolve()
  }
}

const stopWorkers = () => {
  return new Promise((resolve, reject) => {
    try {
      if (wrksReportServiceApi.length) {
        closeWrks(wrksReportServiceApi, () => {
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
  closeIpc,
  closeWrks
}
