'use strict'

const { cloneDeep } = require('lib-js-util-base')

const AbstractWSEventEmitter = require('../../abstract.ws.event.emitter')
const {
  isRateLimitError,
  isNonceSmallError,
  isUserIsNotMerchantError,
  isENetError,
  isAuthError
} = require('../api-errors-testers')
const {
  calcBackOffAndJitteredDelay,
  isInterrupted: _isInterrupted,
  delay,
  getEmptyArrRes
} = require('./helpers')

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
        return getEmptyArrRes()
      }
      if (isRateLimitError(err)) {
        countRateLimitError += 1

        if (countRateLimitError > 100) {
          throw err
        }

        const delayMs = calcBackOffAndJitteredDelay({
          startingDelayMs: 80_000,
          maxDelayMs: 5 * 60 * 1_000,
          ...backOffOpts,
          prevBackOffDelayMs
        })
        prevBackOffDelayMs = delayMs
        const { isInterrupted } = await delay(delayMs, _interrupter)

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

        const { isInterrupted } = await delay(1000, _interrupter)

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
        } = await delay(eNetErrorAttemptsTimeoutMs, _interrupter)

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

      const { isInterrupted } = await delay(10000, _interrupter)

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
