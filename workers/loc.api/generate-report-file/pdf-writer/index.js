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
const TEMPLATE_FILE_NAMES = require('./template-file-names')

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
  #translations = {}
  #templateFolderPath = path.join(__dirname, 'templates')
  #templatePaths = new Map()
  #templates = new Map()

  constructor (
    hasGrcService,
    grcBfxReq
  ) {
    this.hasGrcService = hasGrcService
    this.grcBfxReq = grcBfxReq

    this.#addTranslations()
    this.#addTemplates()
    this.#compileTemplate()
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

  #getTemplate (pdfCustomTemplateName, language) {
    const templateKey = this.#getTemplateKey(
      pdfCustomTemplateName ?? TEMPLATE_FILE_NAMES.MAIN,
      language
    )

    if (this.#templates.has(templateKey)) {
      return this.#templates.get(templateKey)
    }

    return this.#templates.get(this.#getTemplateKey(
      TEMPLATE_FILE_NAMES.MAIN,
      language
    ))
  }

  async renderTemplate (
    apiData,
    opts
  ) {
    const {
      pdfCustomTemplateName,
      language,
      isError
    } = opts ?? {}

    const template = this.#getTemplate(
      pdfCustomTemplateName,
      language
    )
    const html = template({
      apiData,
      language,
      isError
    })

    return html
  }

  #getTranslator (language) {
    return getTranslator({
      language,
      translations: this.#translations
    })
  }

  #addTranslations (trans = translations) {
    const translationsArr = Array.isArray(trans)
      ? trans
      : [trans]

    this.#translationsArr.push(...translationsArr)
    this.#translations = merge({}, ...this.#translationsArr)
  }

  #addTemplates (params) {
    const {
      fileNames = TEMPLATE_FILE_NAMES,
      templateFolderPath = this.#templateFolderPath
    } = params ?? {}

    const _fileNames = this.#getFileNameArray(fileNames)

    for (const fileName of _fileNames) {
      if (
        !fileName ||
        typeof fileName !== 'string'
      ) {
        continue
      }

      this.#templatePaths.set(
        fileName,
        path.join(templateFolderPath, fileName)
      )
    }
  }

  #getFileNameArray (fileNames) {
    if (Array.isArray(fileNames)) {
      return fileNames
    }
    if (
      fileNames &&
      typeof fileNames === 'object'
    ) {
      return Object.values(fileNames)
    }

    return [fileNames]
  }

  #compileTemplate (opts) {
    const _opts = {
      pretty: true,
      ...opts
    }
    const languages = this.#getAvailableLanguages()

    for (const language of languages) {
      const translate = this.#getTranslator(language)

      for (const [templateFileName, templatePath] of this.#templatePaths) {
        const fn = pug.compileFile(templatePath, {
          ..._opts,
          language,
          filters: { translate }
        })
        const templateKey = this.#getTemplateKey(
          templateFileName,
          language
        )

        this.#templates.set(templateKey, fn)
      }
    }
  }

  #getAvailableLanguages () {
    const languages = Object.keys(this.#translations)

    if (languages.length === 0) {
      return ['en']
    }

    return languages
  }

  #getTemplateKey (templateFileName, language) {
    return `${templateFileName}:${language}`
  }
}

decorateInjectable(PdfWriter, depsTypes)

module.exports = PdfWriter
