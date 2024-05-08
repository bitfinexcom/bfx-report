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

const _delay = (mc = 80000, interrupter) => {
  return new Promise((resolve) => {
    const hasInterrupter = interrupter instanceof Interrupter
    const timeout = setTimeout(() => {
      if (hasInterrupter) {
        interrupter.offInterrupt(onceInterruptHandler)
      }

      resolve()
    }, mc)
    const onceInterruptHandler = () => {
      if (!timeout.hasRef()) {
        return
      }

      clearTimeout(timeout)
      resolve()
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
  eNetErrorAttemptsTimeoutMs = 10000, // ms
  shouldNotInterrupt,
  interrupter
}) => {
  const _interrupter = shouldNotInterrupt
    ? null
    : interrupter ?? commonInterrupter

  const ms = 80000

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
        if (_isInterrupted(_interrupter)) {
          return { isInterrupted: true }
        }

        await _delay(ms, _interrupter)

        continue
      }
      if (isNonceSmallError(err)) {
        countNonceSmallError += 1

        if (countNonceSmallError > 20) {
          throw err
        }
        if (_isInterrupted(_interrupter)) {
          return { isInterrupted: true }
        }

        await _delay(1000, _interrupter)

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

        await _delay(eNetErrorAttemptsTimeoutMs, _interrupter)

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
      if (_isInterrupted(_interrupter)) {
        return { isInterrupted: true }
      }

      await _delay(10000, _interrupter)
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
