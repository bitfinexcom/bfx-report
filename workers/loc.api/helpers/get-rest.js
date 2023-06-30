'use strict'

const BFX = require('bitfinex-api-node')

const {
  isNonceSmallError
} = require('./api-errors-testers')
const {
  AuthError,
  GrenacheServiceConfigArgsError
} = require('../errors')

const isTestEnv = process.env.NODE_ENV === 'test'
let bfxInstance = null

const rateLimitCheckerMaps = new Map()
const _rateLimitForMethodName = new Map([
  ['generateToken', null],
  ['invalidateAuthToken', null],
  ['userInfo', 90],
  ['symbols', 90],
  ['futures', 90],
  ['currencies', 90],
  ['inactiveSymbols', 90],
  ['conf', 90],
  ['positionsSnapshot', 90],
  ['getSettings', 90],
  ['updateSettings', 90],
  ['tickersHistory', 30],
  ['positionsHistory', 90],
  ['positions', 90],
  ['positionsAudit', 90],
  ['wallets', 90],
  ['ledgers', 90],
  ['payInvoiceList', 90],
  ['accountTrades', 90],
  ['fundingTrades', 90],
  ['trades', 90],
  ['statusMessages', 90],
  ['candles', 90],
  ['orderTrades', 90],
  ['orderHistory', 90],
  ['activeOrders', 90],
  ['movements', 90],
  ['movementInfo', 90],
  ['fundingOfferHistory', 90],
  ['fundingLoanHistory', 90],
  ['fundingCreditHistory', 90],
  ['accountSummary', 90],
  ['logins', 90],
  ['changeLogs', 90]
])

class RateLimitChecker {
  constructor (conf) {
    this.rateLimit = conf?.rateLimit ?? 10
    this.msPeriod = conf?.msPeriod ?? 60000

    this._calls = []
  }

  clearOldCalls (mts = Date.now()) {
    const min = mts - this.msPeriod

    while (this._calls[0] && this._calls[0] < min) {
      this._calls.shift()
    }
  }

  add () {
    const mts = Date.now()

    this.clearOldCalls(mts)
    this._calls.push(mts)
  }

  getLength () {
    this.clearOldCalls()

    return this._calls.length
  }

  check () {
    return this.getLength() >= this.rateLimit
  }
}

const router = (methodName, method) => {
  if (
    !methodName ||
    methodName.startsWith('_')
  ) {
    return method()
  }

  if (!rateLimitCheckerMaps.has(methodName)) {
    const rateLimit = _rateLimitForMethodName.get(methodName)

    rateLimitCheckerMaps.set(
      methodName,
      new RateLimitChecker({ rateLimit })
    )
  }

  const rateLimitChecker = rateLimitCheckerMaps.get(methodName)

  if (rateLimitChecker.check()) {
    // Cool down delay
    return new Promise((resolve) => setTimeout(resolve, 60000))
      .then(() => {
        rateLimitChecker.add()

        return method()
      })
  }

  rateLimitChecker.add()

  return method()
}

const _checkConf = (conf) => {
  if (
    conf &&
    typeof conf === 'object' &&
    typeof conf.restUrl === 'string'
  ) {
    return
  }

  throw new GrenacheServiceConfigArgsError()
}

const _bfxFactory = (conf) => {
  _checkConf(conf)

  const { restUrl } = conf

  return new BFX({
    transform: true,
    rest: {
      url: isTestEnv
        ? 'http://localhost:9999'
        : restUrl
    }
  })
}

const _asyncApplyHook = async (incomingRes, propKey, ...args) => {
  let attemptsCount = 0
  let caughtErr = null

  while (attemptsCount < 10) {
    try {
      if (
        attemptsCount === 0 &&
        incomingRes
      ) {
        const res = await incomingRes

        return res
      }

      const res = await router(
        propKey,
        () => Reflect.apply(...args)
      )

      return res
    } catch (err) {
      if (isNonceSmallError(err)) {
        attemptsCount += 1
        caughtErr = err

        continue
      }

      throw err
    }
  }

  if (caughtErr) throw caughtErr
}

const _isNotPromiseOrBluebird = (instance) => (
  !(instance instanceof Promise) &&
  (
    !instance ||
    typeof instance !== 'object' ||
    typeof instance.constructor !== 'function' ||
    instance.constructor.name !== 'Promise'
  )
)

const _getRestProxy = (rest) => {
  return new Proxy(rest, {
    get (target, propKey) {
      if (typeof target[propKey] !== 'function') {
        const val = Reflect.get(...arguments)

        return typeof val === 'function'
          ? val.bind(target)
          : val
      }

      return new Proxy(target[propKey], {
        apply () {
          const args = arguments
          let attemptsCount = 0
          let caughtErr = null

          while (attemptsCount < 10) {
            try {
              const res = router(
                propKey,
                () => Reflect.apply(...args)
              )

              if (_isNotPromiseOrBluebird(res)) {
                return res
              }

              return _asyncApplyHook(res, propKey, ...args)
            } catch (err) {
              if (isNonceSmallError(err)) {
                attemptsCount += 1
                caughtErr = err

                continue
              }

              throw err
            }
          }

          if (caughtErr) throw caughtErr
        }
      })
    }
  })
}

module.exports = (conf) => {
  bfxInstance = _bfxFactory(conf)

  return (auth, opts) => {
    if (
      !auth ||
      typeof auth !== 'object'
    ) {
      throw new AuthError()
    }

    const {
      apiKey = '',
      apiSecret = '',
      authToken: _authToken = ''
    } = auth
    const {
      timeout = 90000
    } = opts ?? {}

    /*
     * It uses dynamic getter to fetch refreshed auth token
     * from session in framework mode
     */
    const authToken = typeof auth?.authTokenFn === 'function'
      ? auth.authTokenFn()
      : _authToken

    const _auth = authToken
      ? { authToken }
      : { apiKey, apiSecret }
    const restOpts = {
      timeout,
      ..._auth
    }

    const rest = bfxInstance.rest(2, restOpts)
    const proxy = _getRestProxy(rest)

    return proxy
  }
}
