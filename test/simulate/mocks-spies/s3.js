'use strict'

const workerArgs = ['rest:ext:s3']

function addFunctions (ExtApi) {
  ExtApi.prototype.uploadPresigned = function (space, data, opts, cb) {
    const upload = {
      public_url: 'https://fakeUrl.com',
      key: 'fakeKey',
      s3bucket: 'fakeBucket'
    }
    const grcBfx = this.ctx.grc_bfx
    const call = {
      worker: 'ext.s3',
      on: 'uploadPresigned',
      params: { opts },
      res: { upload },
      timestamp: Date.now()
    }

    grcBfx.req(
      'rest:ext:testcalls',
      'addCall',
      [call],
      { timeout: 10000 },
      (err, data) => {
        if (err) cb(new Error('ext.s3:uploadPresigned:testcalls'))
        else return cb(null, upload)
      }
    )
  }
}

module.exports = {
  addFunctions,
  workerArgs
}
