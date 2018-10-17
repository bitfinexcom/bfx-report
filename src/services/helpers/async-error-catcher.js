'use strict'

const _asyncErrorCatcher = fn => {
  if (typeof fn !== 'function') {
    throw new Error('Must supply a function')
  }

  return (...args) => {
    const fnReturn = fn(...args)
    const next = args[args.length - 1]

    return Promise.resolve(fnReturn).catch(next)
  }
}

const controllerHandler = controller => {
  const obj = {}

  Object.entries(controller).forEach(([key, val]) => {
    obj[key] = _asyncErrorCatcher(val)
  })

  return obj
}

module.exports = controllerHandler
