'use strict'

const getTranslator = (deps, commonOpts) => {
  const {
    i18next
  } = deps ?? {}

  return (defVal = '', opts) => {
    const prop = typeof opts === 'string'
      ? opts
      : opts?.prop
    const options = (
      opts &&
      typeof opts === 'object'
    )
      ? opts
      : {}
    const defaultValue = defVal ??
      commonOpts?.defaultValue ??
      options?.defaultValue ??
      ''

    return i18next.t(prop, {
      ...commonOpts,
      ...options,

      defaultValue
    })
  }
}

module.exports = getTranslator
