'use strict'

const { cloneDeep } = require('lodash')

const {
  isRateLimitError,
  isNonceSmallError
} = require('./api-errors-testers')

const _delay = (mc = 80000) => {
  return new Promise((resolve) => {
    setTimeout(resolve, mc)
  })
}

module.exports = async (
  getData,
  args,
  middleware,
  params
) => {
  const ms = 80000

  let countRateLimitError = 0
  let countNonceSmallError = 0
  let res = null

  while (true) {
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

        await _delay(ms)

        continue
      } else if (isNonceSmallError(err)) {
        countNonceSmallError += 1

        if (countNonceSmallError > 20) {
          throw err
        }

        await _delay(1000)

        continue
      } else throw err
    }
  }

  return res
}
