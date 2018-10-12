'use strict'

const zlib = require('zlib')
const { pick } = require('lodash')
const async = require('async')
const Base = require('bfx-facs-base')

class DeflateFacility extends Base {
  constructor (caller, opts, ctx) {
    super(caller, opts, ctx)

    this.name = 'deflate'
    this._hasConf = false

    this.init()
  }

  _start (cb) {
    async.series([
      next => {
        super._start(next)
      },
      next => {
        this.params = pick(
          { ...this.opts },
          [
            'flush',
            'finishFlush',
            'chunkSize',
            'windowBits',
            'level',
            'memLevel',
            'strategy',
            'dictionary',
            'info'
          ]
        )
      }
    ], cb)
  }

  streamToBuffer (stream) {
    const bufs = []

    return new Promise((resolve, reject) => {
      stream.on('data', (data) => {
        bufs.push(data)
      })
      stream.once('end', () => {
        resolve(Buffer.concat(bufs))
      })
      stream.once('error', err => {
        reject(err)
      })
    })
  }

  createGzip (readStream, params = {}) {
    const gzip = zlib.createGzip({
      ...this.params,
      params
    })

    return readStream.pipe(gzip)
  }

  createBuffGzip (readStream, isGzipOn = true, params = {}) {
    const stream = isGzipOn
      ? this.createGzip(readStream, params)
      : readStream

    return this.streamToBuffer(stream)
  }

  _stop (cb) {
    async.series([
      next => {
        super._stop(next)
      }
    ], cb)
  }
}

module.exports = DeflateFacility
