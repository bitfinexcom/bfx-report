'use strict'

const bfxFactory = require('./bfx.factory')
const { hasS3AndSendgrid } = require('./queue/helpers')

const getREST = (auth, wrkReportServiceApi) => {
  if (typeof auth !== 'object') {
    throw new Error('ERR_ARGS_NO_AUTH_DATA')
  }

  const group = wrkReportServiceApi.group
  const conf = wrkReportServiceApi.conf[group]

  const bfx = bfxFactory({ conf, ...auth })

  return bfx.rest(2, { transform: true })
}

const getLimitNotMoreThan = (limit, maxLimit = 25) => {
  const num = limit || maxLimit
  return Math.min(num, maxLimit)
}

const getParams = (args, maxLimit) => {
  const params = []
  if (args.params) {
    if (typeof args.params !== 'object') {
      throw new Error('ERR_ARGS_NO_PARAMS')
    }
    params.push(
      ...[
        args.params.symbol,
        args.params.start,
        args.params.end,
        getLimitNotMoreThan(args.params.limit, maxLimit)
      ]
    )
  }
  return params
}

const checkParams = (args) => {
  if (
    !args.params ||
    typeof args.params !== 'object' ||
    (args.params.limit && !Number.isInteger(args.params.limit)) ||
    (args.params.start && !Number.isInteger(args.params.start)) ||
    (args.params.end && !Number.isInteger(args.params.end))
  ) {
    throw new Error('ERR_ARGS_NO_PARAMS')
  }
}

const getCsvStoreStatus = async (reportService, args) => {
  if (typeof args.params.email !== 'string') {
    return { isSaveLocaly: true }
  }

  if (!await hasS3AndSendgrid(reportService)) {
    throw new Error('ERR_CAN_NOT_SEND_EMAIL')
  }

  return { isSendEmail: true }
}

module.exports = {
  getREST,
  getLimitNotMoreThan,
  getParams,
  checkParams,
  getCsvStoreStatus
}
