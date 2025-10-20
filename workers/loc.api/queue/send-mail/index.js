'use strict'

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

module.exports = (conf, redisSk0) => {
  return async (
    configs,
    to,
    dataArr
  ) => {
    const promises = dataArr.map(data => {
      const {
        presigned_url: url,
        language = 'en'
      } = data ?? {}

      const payload = {
        ...configs,
        reportUrl: url,
        to,
        lang: _getSendgridLng(language)
      }

      return redisSk0.cli_rw.lpush(conf.mailQueue, JSON.stringify({ type: 'report-download-ready', payload }))
    })

    return Promise.all(promises)
  }
}
