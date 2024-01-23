'use strict'

const { Transform } = require('stream')

const {
  GrcPDFAvailabilityError
} = require('../../errors')

const { decorateInjectable } = require('../../di/utils')

const depsTypes = (TYPES) => [
  TYPES.HasGrcService,
  TYPES.GrcBfxReq
]
class PdfWriter {
  constructor (
    hasGrcService,
    grcBfxReq
  ) {
    this.hasGrcService = hasGrcService
    this.grcBfxReq = grcBfxReq
  }

  async createPDFStream (pdfCustomTemplateName) {
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
          pdfCustomTemplateName
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
    pdfCustomTemplateName
  ) {
    const template = await this.renderTemplate(
      apiData,
      pdfCustomTemplateName
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
    pdfCustomTemplateName
  ) {
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
}

decorateInjectable(PdfWriter, depsTypes)

module.exports = PdfWriter
