'use strict'

const workerArgs = ['rest:core:mail']

function addFunctions (ExtApi) {
  ExtApi.prototype.enqueueEmail = function (space, msg, cb) {
    const {
      lang,
      to,
      reportUrl,
      fileName
    } = msg

    if (!lang) return cb(new Error('ERR_API_NO_LANGUAGE'))
    if (!to) return cb(new Error('ERR_API_NO_TO'))
    if (!reportUrl) return cb(new Error('ERR_API_NO_REPORT_URL'))
    if (!fileName) return cb(new Error('ERR_API_NO_FILE_NAME'))

    try {
      const res = ['send']
      const grcBfx = this.ctx.grc_bfx
      const call = {
        worker: 'core.mail',
        on: 'enqueueEmail',
        params: { msg },
        res: res[0],
        timestamp: Date.now()
      }
      grcBfx.req('rest:ext:testcalls', 'addCall', [call], { timeout: 10000 }, (err, data) => {
        if (err) cb(new Error('core.mail:enqueueEmail:testcalls'))
        else return cb(null, res && res.length && res[0])
      })
    } catch (e) {
      cb(new Error(`ERR_API_MAIL: ${e.toString()}`))
    }
  }
}

module.exports = {
  addFunctions,
  workerArgs
}
