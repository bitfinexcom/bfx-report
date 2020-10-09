'use strict'

const { cloneDeep } = require('lodash')

const Interrupter = require('../interrupter')
const {
  isRateLimitError,
  isNonceSmallError
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

module.exports = async (
  getData,
  args,
  middleware,
  params,
  interrupter
) => {
  const ms = 80000

  let countRateLimitError = 0
  let countNonceSmallError = 0
  let res = null

  while (true) {
    if (_isInterrupted(interrupter)) {
      return { isInterrupted: true }
    }

    try {
      const _args = cloneDeep(args)

      if (
        typeof getData === 'string' &&
        typeof middleware === 'function'
      ) {
        res = await middleware(
          getData,
          _args,
          params
        )

        break
      }

      res = await getData(null, _args)

      break
    } catch (err) {
      if (isRateLimitError(err)) {
        countRateLimitError += 1

        if (countRateLimitError > 2) {
          throw err
        }
        if (_isInterrupted(interrupter)) {
          return { isInterrupted: true }
        }

        await _delay(ms, interrupter)

        continue
      }
      if (isNonceSmallError(err)) {
        countNonceSmallError += 1

        if (countNonceSmallError > 20) {
          throw err
        }
        if (_isInterrupted(interrupter)) {
          return { isInterrupted: true }
        }

        await _delay(1000, interrupter)

        continue
      }

      throw err
    }
  }

  return res
}
