'use strict'

const { Transform } = require('stream')
const path = require('path')
const fs = require('fs')
const pug = require('pug')
const yaml = require('js-yaml')
const { merge } = require('lib-js-util-base')

const getTranslator = require('../../helpers/get-translator')
const {
  GrcPDFAvailabilityError
} = require('../../errors')

const pathToTrans = path.join(
  __dirname,
  'translations.yml'
)
const translations = yaml.load(
  fs.readFileSync(pathToTrans, 'utf8')
)

const { decorateInjectable } = require('../../di/utils')

const depsTypes = (TYPES) => [
  TYPES.HasGrcService,
  TYPES.GrcBfxReq
]
class PdfWriter {
  #translationsArr = []

  constructor (
    hasGrcService,
    grcBfxReq
  ) {
    this.hasGrcService = hasGrcService
    this.grcBfxReq = grcBfxReq

    this.#addTranslations(translations)
  }

  async createPDFStream (opts) {
    const pdfWriter = this

    return new Transform({
      writableObjectMode: true,

      construct (cb) {
        this.data = []
        cb()
      },
      transform (chunk, encoding, cb) {
        if (Array.isArray(chunk)) {
          this.data.push(...chunk)
          cb()

          return
        }

        this.data.push(chunk)
        cb()
      },
      flush (cb) {
        pdfWriter.processPdf(
          this.data,
          opts
        ).then((buffer) => {
          this.push(buffer)
          this.push(null)
          cb()
        }).catch((err) => {
          cb(err)
        })
      }
    })
  }

  async processPdf (
    apiData,
    opts
  ) {
    const template = await this.renderTemplate(
      apiData,
      opts
    )
    const buffer = await this.createPDFBuffer({ template })

    return buffer
  }

  async createPDFBuffer (args) {
    const _args = {
      template: 'No data',
      format: 'portrait',
      orientation: 'Letter',
      ...args
    }

    if (!await this.hasGrcService.hasPDFService()) {
      throw new GrcPDFAvailabilityError()
    }

    const res = await this.grcBfxReq({
      service: 'rest:ext:pdf',
      action: 'createPDFBuffer',
      args: [_args]
    })

    return res
  }

  // TODO: Mocked template, need to implement using pug
  async renderTemplate (
    apiData,
    opts
  ) {
    const {
      pdfCustomTemplateName,
      language
    } = opts ?? {}

    const translate = this.#getTranslator(language)

    const html = `\
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <title>Bitfinex Reports</title>
  </head>
<body>
  Test TEXT<br/>
  ---------<br/>
  <p>${JSON.stringify(apiData)}</p>
  ---------<br/>
  One more<br/>
</body>
</html>`

    return html
  }

  #getTranslator (language) {
    const translations = this.#getTranslations()

    return getTranslator({ language, translations })
  }

  #addTranslations (translations) {
    const translationsArr = Array.isArray(translations)
      ? translations
      : [translations]

    this.#translationsArr.push(...translationsArr)
  }

  #getTranslations () {
    return merge({}, ...this.#translationsArr)
  }
}

decorateInjectable(PdfWriter, depsTypes)

module.exports = PdfWriter
