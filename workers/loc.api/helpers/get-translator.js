'use strict'

const LANGUAGES = require('./languages')

const getTranslator = (params) => {
  const {
    language = 'en',
    translations,
    isNotDefaultTranslatorUsed = false
  } = params ?? {}

  const normLang = LANGUAGES?.[language] ?? 'en'
  const translatorByDefault = (
    !isNotDefaultTranslatorUsed &&
    getTranslator({
      language: 'en',
      translations,
      isNotDefaultTranslatorUsed: true
    })
  )

  return (defVal = '', opts) => {
    const prop = typeof opts === 'string'
      ? opts
      : opts?.prop

    if (
      !translations?.[normLang] ||
      typeof translations[normLang] !== 'object' ||
      Object.keys(translations[normLang]) === 0 ||
      typeof prop !== 'string' ||
      !prop
    ) {
      return translatorByDefault
        ? translatorByDefault(defVal, prop)
        : defVal
    }

    const res = prop.split('.').reduce((accum, curr) => {
      if (
        typeof accum[curr] === 'object' ||
        typeof accum[curr] === 'string' ||
        Number.isFinite(accum[curr])
      ) {
        return accum[curr]
      }

      return accum
    }, translations[normLang])

    if (typeof res === 'object') {
      return translatorByDefault
        ? translatorByDefault(defVal, prop)
        : defVal
    }

    return res
  }
}

module.exports = getTranslator
