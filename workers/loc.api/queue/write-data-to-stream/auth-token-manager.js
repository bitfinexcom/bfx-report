'use strict'

const { AuthError } = require('../../errors')

const regenerateAuthToken = async (auth, deps) => {
  const { authToken } = auth ?? {}

  if (
    !authToken ||
    typeof authToken !== 'string'
  ) {
    return auth
  }

  const {
    rService,
    getDataFromApi
  } = deps ?? {}

  try {
    const opts = {
      ttl: 60 * 60,
      writePermission: false
    }

    const res = await getDataFromApi({
      getData: (s, args) => rService._generateToken(args, opts),
      args: { auth },
      callerName: 'REPORT_FILE_WRITER',
      eNetErrorAttemptsTimeframeMin: 10 / 60,
      eNetErrorAttemptsTimeoutMs: 1000,
      shouldNotInterrupt: true
    })

    const [authToken] = Array.isArray(res) ? res : [null]

    if (!authToken) {
      throw new AuthError()
    }

    return { authToken }
  } catch (err) {
    throw new AuthError({
      data: {
        isAuthTokenGenerationError: true,
        rootMessage: err.toString()
      }
    })
  }
}

const invalidateAuthToken = async (auth, deps) => {
  const { authToken } = auth ?? {}

  if (
    !authToken ||
    typeof authToken !== 'string'
  ) {
    return
  }

  const {
    rService,
    getDataFromApi
  } = deps ?? {}

  try {
    await getDataFromApi({
      getData: (s, args) => rService._invalidateAuthToken(args),
      args: { auth, params: { authToken } },
      callerName: 'REPORT_FILE_WRITER',
      eNetErrorAttemptsTimeframeMin: 10 / 60,
      eNetErrorAttemptsTimeoutMs: 1000,
      shouldNotInterrupt: true
    })
  } catch (err) {
    throw new AuthError({
      data: {
        isAuthTokenInvalidationError: true,
        rootMessage: err.toString()
      }
    })
  }
}

module.exports = {
  regenerateAuthToken,
  invalidateAuthToken
}
