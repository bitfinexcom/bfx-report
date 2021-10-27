'use strict'

const path = require('path')
const fs = require('fs')
const pug = require('pug')
const yaml = require('js-yaml')

const basePathToViews = path.join(__dirname, 'views')
const pathToTrans = path.join(
  __dirname,
  'translations/email.yml'
)
const translations = yaml.load(
  fs.readFileSync(pathToTrans, 'utf8')
)

const _getTranslator = (
  language = 'en',
  trans = translations,
  isNotDefaultTranslatorUsed = false
) => {
  const translatorByDefault = (
    !isNotDefaultTranslatorUsed &&
    _getTranslator('en', trans, true)
  )

  return (defVal = '', opts) => {
    const prop = typeof opts === 'string'
      ? opts
      : ({ ...opts }).prop

    if (
      !trans ||
      typeof trans !== 'object' ||
      !trans[language] ||
      typeof trans[language] !== 'object' ||
      Object.keys(trans[language]) === 0 ||
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
    }, trans[language])

    if (typeof res === 'object') {
      return translatorByDefault
        ? translatorByDefault(defVal, prop)
        : defVal
    }

    return res
  }
}

module.exports = (grcBfxReq) => {
  return async (
    configs,
    to,
    viewName,
    dataArr
  ) => {
    const pathToView = path.join(basePathToViews, viewName)

    const promises = dataArr.map(data => {
      const {
        presigned_url: url,
        language = 'en'
      } = { ...data }
      const translate = _getTranslator(language)
      const subject = translate(
        configs.subject,
        'template.subject'
      )
      const text = pug.renderFile(
        pathToView,
        {
          ...data,
          filters: { translate }
        }
      )
      const button = {
        url,
        text: translate(
          'Download CSV',
          'template.btnText'
        )
      }
      const mailOptions = {
        ...configs,
        to,
        text,
        subject,
        button,
        language
      }

      return grcBfxReq({
        service: 'rest:ext:sendgrid',
        action: 'sendEmail',
        args: [mailOptions]
      })
    })

    return Promise.all(promises)
  }
}
