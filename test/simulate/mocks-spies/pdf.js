'use strict'

const workerArgs = ['rest:ext:pdf']

const getMockBuffer = (template) => Buffer.from(template, 'utf8')

function addFunctions (ExtApi) {
  ExtApi.prototype.createPDFBuffer = async function (space, args, cb) {
    const {
      template,
      format,
      orientation
    } = args

    if (!template) return cb(new Error('ERR_API_NO_TEMPLATE'))
    if (!format) return cb(new Error('ERR_API_NO_FORMAT'))
    if (!orientation) return cb(new Error('ERR_API_NO_ORIENTATION'))

    const pdfBuffer = getMockBuffer(template)

    const grcBfx = this.ctx.grc_bfx
    const call = {
      worker: 'ext.pdf',
      on: 'createPDFBuffer',
      params: { args },
      res: { pdfBuffer },
      timestamp: Date.now()
    }

    grcBfx.req(
      'rest:ext:testcalls',
      'addCall',
      [call],
      { timeout: 10000 },
      (err, data) => {
        if (err) cb(new Error('ext.pdf:createPDFBuffer:testcalls'))
        else return cb(null, pdfBuffer)
      }
    )
  }
}

module.exports = {
  addFunctions,
  workerArgs
}
