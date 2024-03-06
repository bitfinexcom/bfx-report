'use strict'

const path = require('path')
const fs = require('fs')
const pug = require('pug')
const yaml = require('js-yaml')

const getTranslator = require('../../helpers/get-translator')
const LANGUAGES = require('../../helpers/languages')

const basePathToViews = path.join(__dirname, 'views')
const pathToTrans = path.join(
  __dirname,
  'translations/email.yml'
)
const translations = yaml.load(
  fs.readFileSync(pathToTrans, 'utf8')
)

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
      const normLang = LANGUAGES?.[language] ?? 'en'
      const translate = getTranslator({
        language: normLang,
        translations
      })
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
          'Download Report',
          'template.btnText'
        )
      }
      const mailOptions = {
        ...configs,
        to,
        text,
        subject,
        button,
        language: normLang
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
