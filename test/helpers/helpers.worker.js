'use strict'

const { fork } = require('child_process')
const path = require('path')
const worker = require('bfx-svc-boot-js/lib/worker')

const _serviceRoot = path.join(__dirname, '../..')

const ipcs = []
const wrksReportServiceApi = []

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
      path.join(
        __dirname,
        '..',
        'simulate/bfx-ext-mockspy-js',
        'worker.js'
      ),
      [
        '--env=development',
        '--wtype=wrk-ext-mockspy-api',
        `--apiPort=${worker.port}`,
        `--mockspy=${worker.name}`
      ],
      { silent: !logs }
    )
  })
}

const _startWrk = (
  conf = {},
  isForkWrk,
  serviceRoot,
  logs
) => {
  if (isForkWrk) {
    const args = Object
      .keys(conf)
      .map(key => `--${key}=${conf[key]}`)

    const wrkIpc = fork(
      path.join(serviceRoot, 'worker.js'),
      args,
      { silent: !logs }
    )

    ipcs.push(wrkIpc)

    return
  }

  const wrk = worker({
    ...conf,
    serviceRoot
  })

  wrksReportServiceApi.push(wrk)
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
    dbId: 1,
    isSpamRestrictionMode: false,
    ...conf
  }

  let {
    apiPort,
    dbId
  } = { ..._conf }

  for (let i = 0; i < countWrk; i += 1) {
    _startWrk(
      {
        ..._conf,
        apiPort,
        dbId
      },
      isForkWrk,
      serviceRoot,
      logs
    )

    apiPort += 1
    dbId += 1
  }

  const helperWrks = startHelpers(logs)

  const serviceWrksAmount = isForkWrk
    ? ipcs.length
    : wrksReportServiceApi.length
  const helperWrksAmount = helperWrks.length

  ipcs.push(...helperWrks)

  return {
    wrksReportServiceApi,
    amount: serviceWrksAmount + helperWrksAmount
  }
}

const closeIpc = async (ipcs) => {
  while (
    Array.isArray(ipcs) &&
    ipcs.length > 0
  ) {
    const ipc = ipcs.pop()

    const promise = new Promise((resolve, reject) => {
      ipc.once('error', reject)
      ipc.once('close', () => {
        ipc.removeListener('error', reject)
        resolve()
      })
    })

    ipc.kill()

    await promise
  }
}

const closeWrks = async (wrks) => {
  while (
    Array.isArray(wrks) &&
    wrks.length > 0
  ) {
    const wrk = wrks.pop()

    await new Promise((resolve, reject) => {
      wrk.stop((err) => {
        if (err) {
          reject(err)

          return
        }

        resolve()
      })
    })
  }
}

const stopWorkers = async () => {
  await closeWrks(wrksReportServiceApi)
  await closeIpc(ipcs)
}

module.exports = {
  stopWorkers,
  startWorkers,
  startHelpers,
  closeIpc,
  closeWrks
}
