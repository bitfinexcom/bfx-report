'use strict'

const getRandomInt = require('./get-random-int')

/**
 * Decorrelated Jitter implementation
 * https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
 */
module.exports = (opts) => {
  const {
    startingDelayMs = 80 * 1_000,
    maxDelayMs = 5 * 60 * 1_000,
    timeMultiple = 1.3,
    prevBackOffDelayMs = 0,
    numOfDelayedAttempts = 1
  } = opts ?? {}

  const startingDelayShifterMs = 5_000 * numOfDelayedAttempts
  const _startingDelayMs = startingDelayMs + startingDelayShifterMs
  const calcedDelay = prevBackOffDelayMs * timeMultiple

  if (calcedDelay < _startingDelayMs) {
    return startingDelayMs
  }

  const jitteredDelay = getRandomInt(_startingDelayMs, calcedDelay)
  const limitedDelay = Math.min(maxDelayMs, jitteredDelay)

  return limitedDelay
}
