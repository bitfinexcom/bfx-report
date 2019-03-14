'use strict'

const bfxFactory = require('./bfx.factory')
const { AuthError } = require('../errors')

module.exports = (auth, wrkReportServiceApi) => {
  if (typeof auth !== 'object') {
    throw new AuthError()
  }

  const group = wrkReportServiceApi.group
  const conf = wrkReportServiceApi.conf[group]

  const bfx = bfxFactory({ conf, ...auth })

  return bfx.rest(2, { transform: true })
}
