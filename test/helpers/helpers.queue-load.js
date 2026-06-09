'use strict'

require('events')
  .EventEmitter
  .defaultMaxListeners = 20

const argv = require('yargs').argv

const QUEUE_EVENT_NAMES = require(
  '../../workers/loc.api/queue/queue.event.names'
)

const {
  startEnvironment,
  stopEnvironment
} = require('./helpers.boot')

const _emitError = (name, err) => {
  process.send({ action: `${name}:error`, err })
}

const _emitRes = (name, result) => {
  process.send({ action: `${name}:completed`, result })
}

const _stop = () => {
  stopEnvironment()
    .then(process.exit)
    .catch(process.exit)
}

process.on('SIGINT', _stop)
process.on('SIGHUP', _stop)
process.on('SIGTERM', _stop)

;(async () => {
  try {
    const {
      wrksReportServiceApi: [wrkReportServiceApi]
    } = await startEnvironment(
      true,
      false,
      1,
      { ...argv },
      undefined,
      true
    )

    await new Promise((resolve) => {
      wrkReportServiceApi.once('wrk:ready', resolve)
    })

    const processorQueue = wrkReportServiceApi.lokue_processor.q
    const aggregatorQueue = wrkReportServiceApi.lokue_aggregator.q

    processorQueue.once(QUEUE_EVENT_NAMES.ERROR_BASE, (err) => {
      _emitError('processor', err)
      _stop()
    })
    processorQueue.on(QUEUE_EVENT_NAMES.COMPLETED, (res) => {
      _emitRes('processor', res)
    })
    aggregatorQueue.once(QUEUE_EVENT_NAMES.ERROR_BASE, (err) => {
      _emitError('aggregator', err)
      _stop()
    })
    aggregatorQueue.on(QUEUE_EVENT_NAMES.COMPLETED, (res) => {
      _emitRes('aggregator', res)
    })
  } catch (err) {
    process.send({ action: 'error', err })

    _stop()
  }
})()
