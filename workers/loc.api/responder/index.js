'use strict'

module.exports = async (logger, handler, name, cb) => {
  try {
    const res = await handler()

    if (!cb) return res
    cb(null, res)
  } catch (err) {
    const _name = name
      ? `\n  - METHOD_NAME: ${name}`
      : ''
    const _statusCode = err.statusCode
      ? `\n  - STATUS_CODE: ${err.statusCode}`
      : ''
    const _options = err.options
      ? `\n  - OPTION: ${err.options}`
      : ''
    const _err = `\n  - ${err.stack || err}`

    logger.error(`${_name}${_statusCode}${_options}${_err}`)

    if (cb) cb(err)
    else throw err
  }
}
