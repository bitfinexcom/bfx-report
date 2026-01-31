'use strict'

const { pipeline } = require('node:stream/promises')

module.exports = async (stringifier, writable, opts) => {
  try {
    const end = opts?.end ?? true

    await pipeline(stringifier, writable, { end })
  } catch (err) {
    /*
     * If an error occurs, eg when receiving data from the BFX API,
     * a recording may occur after destruction in the stream
     */
    if (
      err.code === 'ERR_STREAM_DESTROYED' ||
      err.code === 'ERR_STREAM_PREMATURE_CLOSE'
    ) {
      return
    }

    throw err
  }
}
