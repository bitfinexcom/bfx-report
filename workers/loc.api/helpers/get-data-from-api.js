'use strict'

const { cloneDeep } = require('lib-js-util-base')

const Interrupter = require('../interrupter')
const AbstractWSEventEmitter = require('../abstract.ws.event.emitter')
const {
  isRateLimitError,
  isNonceSmallError,
  isUserIsNotMerchantError,
  isENetError,
  isAuthError
} = require('./api-errors-testers')

const _getRandomInt = (min, max) => {
  const minCeiled = Math.ceil(min)
  const maxFloored = Math.floor(max)

  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled)
}

/**
 * Decorrelated Jitter implementation
 * https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
 */
const _calcBackOffAndJitteredDelay = (opts) => {
  const {
    startingDelayMs = 80 * 1_000,
    maxDelayMs = 5 * 60 * 1_000,
    timeMultiple = 1.3,
    prevBackOffDelayMs = 0,
    numOfDelayedAttempts = 1
  } = opts ?? {}

  const startingDelayShifterMs = 5_000 * numOfDelayedAttempts
  const _startingDelayMs = startingDelayMs + startingDelayShifterMs
  const calcedDelay = prevBackOffDelayMs * timeMultiple

  if (calcedDelay < _startingDelayMs) {
    return startingDelayMs
  }

  const jitteredDelay = _getRandomInt(_startingDelayMs, calcedDelay)
  const limitedDelay = Math.min(maxDelayMs, jitteredDelay)

  return limitedDelay
}

const _delay = (mc = 80000, interrupter) => {
  if (_isInterrupted(interrupter)) {
    return Promise.resolve({ isInterrupted: true })
  }

  return new Promise((resolve) => {
    const hasInterrupter = interrupter instanceof Interrupter
    const timeout = setTimeout(() => {
      if (hasInterrupter) {
        interrupter.offInterrupt(onceInterruptHandler)
      }

      resolve({ isInterrupted: false })
    }, mc)
    const onceInterruptHandler = () => {
      if (!timeout.hasRef()) {
        return
      }

      clearTimeout(timeout)
      resolve({ isInterrupted: true })
    }

    if (hasInterrupter) {
      interrupter.onceInterrupt(onceInterruptHandler)
    }
  })
}

const _isInterrupted = (interrupter) => {
  return (
    interrupter instanceof Interrupter &&
    interrupter.hasInterrupted()
  )
}

const _getEmptyArrRes = () => {
  return { jsonrpc: '2.0', result: [], id: null }
}

module.exports = (
  commonInterrupter,
  wsEventEmitter
) => async ({
  getData,
  args,
  middleware,
  middlewareParams,
  callerName,
  eNetErrorAttemptsTimeframeMin = 10, // min
  eNetErrorAttemptsTimeoutMs = 10_000, // ms
  shouldNotInterrupt,
  interrupter,
  backOffOpts
}) => {
  const _interrupter = shouldNotInterrupt
    ? null
    : interrupter ?? commonInterrupter

  let prevBackOffDelayMs = 0
  let countNetError = 0
  let countRateLimitError = 0
  let countNonceSmallError = 0
  let countUnexpectedError = 0
  let res = null

  while (true) {
    if (_isInterrupted(_interrupter)) {
      return { isInterrupted: true }
    }

    try {
      const _args = cloneDeep(args) ?? {}

      /*
       * API request should not be logged to std error stream
       * when making an internal call and can have some attempts
       * due to an internet connection issue
       */
      _args.shouldNotBeLoggedToStdErrorStream = true
      _args.interrupter = _interrupter

      if (
        typeof getData === 'string' &&
        typeof middleware === 'function'
      ) {
        res = await middleware(
          getData,
          _args,
          middlewareParams
        )

        break
      }

      res = await getData(null, _args)

      break
    } catch (err) {
      if (isUserIsNotMerchantError(err)) {
        return _getEmptyArrRes()
      }
      if (isRateLimitError(err)) {
        countRateLimitError += 1

        if (countRateLimitError > 100) {
          throw err
        }

        const delay = _calcBackOffAndJitteredDelay({
          startingDelayMs: 80_000,
          maxDelayMs: 3 * 60 * 1_000,
          ...backOffOpts,
          prevBackOffDelayMs,
          numOfDelayedAttempts: countRateLimitError
        })
        prevBackOffDelayMs = delay
        const { isInterrupted } = await _delay(delay, _interrupter)

        if (isInterrupted) {
          return { isInterrupted }
        }

        continue
      }
      if (isNonceSmallError(err)) {
        countNonceSmallError += 1

        if (countNonceSmallError > 20) {
          throw err
        }

        const { isInterrupted } = await _delay(1000, _interrupter)

        if (isInterrupted) {
          return { isInterrupted }
        }

        continue
      }
      if (isENetError(err)) {
        countNetError += 1

        const attemptsNum = (eNetErrorAttemptsTimeframeMin * 60) / (eNetErrorAttemptsTimeoutMs / 1000)

        if (countNetError > attemptsNum) {
          throw err
        }
        if (_isInterrupted(_interrupter)) {
          return { isInterrupted: true }
        }
        if (
          countNetError === 1 &&
          wsEventEmitter instanceof AbstractWSEventEmitter
        ) {
          await wsEventEmitter.emitENetError(callerName)
        }

        const {
          isInterrupted
        } = await _delay(eNetErrorAttemptsTimeoutMs, _interrupter)

        if (isInterrupted) {
          return { isInterrupted }
        }

        continue
      }

      // Handle unexpected BFX API errors
      countUnexpectedError += 1

      if (
        countUnexpectedError > 3 ||
        isAuthError(err)
      ) {
        throw err
      }

      const { isInterrupted } = await _delay(10000, _interrupter)

      if (isInterrupted) {
        return { isInterrupted }
      }
    }
  }

  if (
    countNetError > 0 &&
    wsEventEmitter instanceof AbstractWSEventEmitter
  ) {
    await wsEventEmitter.emitENetResumed(callerName)
  }

  return res
}
