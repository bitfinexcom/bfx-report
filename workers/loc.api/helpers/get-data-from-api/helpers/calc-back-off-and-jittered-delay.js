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
    startingTimeMultiplier = 1.2,
    endingTimeMultiplier = 1.5,
    prevBackOffDelayMs = 0
  } = opts ?? {}

  const prevDelayNotLessStarting = Math.max(startingDelayMs, prevBackOffDelayMs)

  const calcedStar = prevDelayNotLessStarting * startingTimeMultiplier
  const calcedEnd = prevDelayNotLessStarting * endingTimeMultiplier

  const jitteredDelay = getRandomInt(calcedStar, calcedEnd)
  const limitedDelay = Math.min(maxDelayMs, jitteredDelay)

  return limitedDelay
}
