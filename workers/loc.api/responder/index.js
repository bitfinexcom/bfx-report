'use strict'

const _prepareErrorData = (err, name) => {
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

  return `${_name}${_statusCode}${_options}${_err}`
}

module.exports = (
  container,
  logger
) => (
  handler,
  name,
  done
) => {
  const cb = typeof name === 'function'
    ? name
    : done

  try {
    const resFn = handler(container)

    if (resFn instanceof Promise) {
      if (!cb) {
        return resFn
          .catch((err) => {
            logger.error(_prepareErrorData(err, name))

            return Promise.reject(err)
          })
      }

      resFn
        .then((res) => cb(null, res))
        .catch((err) => {
          logger.error(_prepareErrorData(err, name))

          cb(err)
        })

      return
    }

    if (!cb) return resFn
    cb(null, resFn)
  } catch (err) {
    logger.error(_prepareErrorData(err, name))

    if (cb) cb(err)
    else throw err
  }
}
