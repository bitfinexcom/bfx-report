'use strict'

const path = require('path')
const pug = require('pug')

const getTranslator = require('../../helpers/get-translator')
const TRANSLATION_NAMESPACES = require(
  '../../i18next/translation.namespaces'
)

const basePathToViews = path.join(__dirname, 'views')

const SENDGRID_WORKER_SUPPORTED_LNGS = {
  en: 'en',
  'en-US': 'en',
  ru: 'ru',
  'ru-RU': 'ru',
  zh: 'zh-CN',
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
  pt: 'pt-BR',
  'pt-PT': 'pt-BR',
  'pt-BR': 'pt-BR'
}

const _getSendgridLng = (lng) => {
  return SENDGRID_WORKER_SUPPORTED_LNGS[lng] ?? lng
}

module.exports = (grcBfxReq, i18next) => {
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
      } = data ?? {}
      const translate = getTranslator(
        { i18next },
        {
          lng: language,
          ns: TRANSLATION_NAMESPACES.EMAIL
        }
      )
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
        language: _getSendgridLng(language)
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
