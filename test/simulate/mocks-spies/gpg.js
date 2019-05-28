'use strict'

const workerArgs = ['rest:ext:gpg']

function addFunctions (ExtApi) {
  ExtApi.prototype.getDigitalSignature = function (space, file, args, cb) {
    const signature = `-----BEGIN PGP SIGNATURE-----
    Version: OpenPGP.js v4.5.2
    Comment: https://openpgpjs.org
    
    wl4EARYKAAYFAlzr1kMACgkQFh7gOz3Qo1Pe5QEAkpPma81YUttJNEK7zPfF
    cvJxqAW4w9Crfobqk+wvb3cA/07ej6osCli0twWcNtDw6YkWiip+IT0+SMOH
    08ODZ/ED
    =hXVs
    -----END PGP SIGNATURE-----`

    const {
      userId,
      username,
      email
    } = args

    if (!file) return cb(new Error('ERR_API_NO_FILE'))
    if (!userId) return cb(new Error('ERR_API_NO_USER_ID'))
    if (!username) return cb(new Error('ERR_API_NO_USERNAME'))
    if (!email) return cb(new Error('ERR_API_NO_EMAIL'))

    const grcBfx = this.ctx.grc_bfx
    const call = {
      worker: 'ext.gpg',
      on: 'getDigitalSignature',
      params: { file, args },
      res: { signature },
      timestamp: Date.now()
    }

    grcBfx.req(
      'rest:ext:testcalls',
      'addCall',
      [call],
      { timeout: 10000 },
      (err, data) => {
        if (err) cb(new Error('ext.gpg:getDigitalSignature:testcalls'))
        else return cb(null, signature)
      }
    )
  }

  ExtApi.prototype.verifyDigitalSignature = function (space, file, args, cb) {
    const isValid = true

    const {
      signature,
      fileHash
    } = args

    if (!signature) return cb(new Error('ERR_API_NO_SIGNATURE'))
    if (!fileHash) return cb(new Error('ERR_API_NO_FILE_HASH'))

    const grcBfx = this.ctx.grc_bfx
    const call = {
      worker: 'ext.gpg',
      on: 'verifyDigitalSignature',
      params: { file, args },
      res: { isValid },
      timestamp: Date.now()
    }

    grcBfx.req(
      'rest:ext:testcalls',
      'addCall',
      [call],
      { timeout: 10000 },
      (err, data) => {
        if (err) cb(new Error('ext.gpg:verifyDigitalSignature:testcalls'))
        else return cb(null, isValid)
      }
    )
  }
}

module.exports = {
  addFunctions,
  workerArgs
}
