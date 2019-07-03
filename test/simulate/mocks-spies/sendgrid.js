'use strict'

const workerArgs = ['rest:ext:sendgrid']

function addFunctions (ExtApi) {
  ExtApi.prototype.sendEmail = function (space, msg, cb) {
    const {
      to,
      from,
      subject,
      text
    } = msg

    if (!to) return cb(new Error('ERR_API_NO_TO'))
    if (!from) return cb(new Error('ERR_API_NO_FROM'))
    if (!subject) return cb(new Error('ERR_API_NO_SUBJECT'))
    if (!text) return cb(new Error('ERR_API_NO_TEXT'))

    try {
      const res = ['send']
      const grcBfx = this.ctx.grc_bfx
      const call = {
        worker: 'ext.sendgrid',
        on: 'sendEmail',
        params: { msg },
        res: res[0],
        timestamp: Date.now()
      }
      grcBfx.req('rest:ext:testcalls', 'addCall', [call], { timeout: 10000 }, (err, data) => {
        if (err) cb(new Error('ext.sendgrid:sendEmail:testcalls'))
        else return cb(null, res && res.length && res[0])
      })
    } catch (e) {
      cb(new Error(`ERR_API_SENDGRID: ${e.toString()}`))
    }
  }
}

module.exports = {
  addFunctions,
  workerArgs
}
