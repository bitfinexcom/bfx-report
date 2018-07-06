'use strict'

const { Api } = require('bfx-wrk-api')

class ExtS3 extends Api {
  space (service, msg) {
    const space = super.space(service, msg)
    return space
  }

  uploadPresigned (space, data, opts, cb) {
    const upload = {
      public_url: 'https://fakeUrl.com',
      key: 'fakeKey',
      s3bucket: 'fakeBucket'
    }
    const grcBfx = this.ctx.grc_bfx
    const call = {
      worker: 'ext.s3',
      on: 'uploadPresigned',
      params: {data, opts},
      res: {upload},
      timestamp: Date.now()
    }
    grcBfx.req('rest:ext:testcalls', 'addCall', [call], {timeout: 2000}, (err, data) => {
      if (err) cb(new Error('ext.s3:uploadPresigned:testcalls'))
      else return cb(null, upload)
    })
  }
}

module.exports = ExtS3
