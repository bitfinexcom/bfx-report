'use strict'

const { min, max } = require('lodash')
const moment = require('moment-timezone')

const { TimeframeError } = require('../errors')

const MIN_START_MTS = Date.UTC(2013)

const getDateNotMoreNow = (mts, now = Date.now()) => {
  return min([mts, now])
}

const getDateNotLessMinStart = (mts, minStart = MIN_START_MTS) => {
  return max([mts, minStart])
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
