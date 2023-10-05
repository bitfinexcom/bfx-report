'use strict'

const moment = require('moment-timezone')

const { TimeframeError } = require('../errors')

const MIN_START_MTS = Date.UTC(2013)

const getDateNotMoreNow = (mts, now = Date.now()) => {
  if (!Number.isFinite(mts)) {
    return now
  }

  return Math.min(mts, now)
}

const getDateNotLessMinStart = (mts, minStart = MIN_START_MTS) => {
  if (!Number.isFinite(mts)) {
    return minStart
  }

  return Math.max(mts, minStart)
}

const _setDefaultTimeIfNotExist = (args) => {
  args.params.end = getDateNotMoreNow(args.params.end)
  args.params.start = getDateNotLessMinStart(args.params.start)
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
  MIN_START_MTS,

  getDateNotMoreNow,
  getDateNotLessMinStart,
  checkTimeLimit
}
