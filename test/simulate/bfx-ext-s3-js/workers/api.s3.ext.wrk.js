'use strict'

const { WrkApi } = require('bfx-wrk-api')

class WrkExtS3Api extends WrkApi {
  constructor (conf, ctx) {
    super(conf, ctx)

    this.loadConf('s3.ext', 'ext')

    this.init()
    this.start()
  }

  init () {
    super.init()
  }

  getApiConf () {
    return {
      path: 's3.ext'
    }
  }
}

module.exports = WrkExtS3Api
