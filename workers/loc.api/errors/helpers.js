'use strict'

const getErrorArgs = (
  args,
  messageByDefault = 'ERR_ERROR_HAS_OCCURRED'
) => {
  const argsObj = typeof args === 'string'
    ? { message: args }
    : { ...args }
  const {
    message = messageByDefault,
    data = null
  } = argsObj

  return { message, data }
}

module.exports = {
  getErrorArgs
}
