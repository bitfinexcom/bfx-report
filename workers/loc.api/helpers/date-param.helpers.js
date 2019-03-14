'use strict'

const moment = require('moment-timezone')

const { getLimitNotMoreThan } = require('./limit-param.helpers')
const { TimeframeError } = require('../errors')

const getDateNotMoreNow = (date, now = Date.now()) => {
  return getLimitNotMoreThan(date, now)
}

const _setDefaultTimeIfNotExist = (args) => {
  args.params.end = getDateNotMoreNow(args.params.end)
  args.params.start = args.params.start
    ? args.params.start
    : 0
}

const checkTimeLimit = (args) => {
  _setDefaultTimeIfNotExist(args)

  const { start, end } = args.params
  const startDate = moment(start)
  const endDate = moment(end)

  if (start >= end || endDate.diff(startDate, 'months') > 1) {
    throw new TimeframeError()
  }
}

module.exports = {
  getDateNotMoreNow,
  checkTimeLimit
}
