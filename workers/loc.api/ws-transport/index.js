'use strict'

const { omit } = require('lodash')
const { PeerRPCServer } = require('grenache-nodejs-ws')

const { FindMethodError } = require('../errors')
const WSEventEmmiter = require('./ws.event.emmiter')

class WSTransport {
  constructor ({
    grc_bfx: grcBfx,
    group,
    conf = {}
  } = {}) {
    const { wsPort } = { ...conf[group] }

    this.wsPort = wsPort
    this.link = grcBfx.link
    this.rService = grcBfx.api
    this.opts = { ...grcBfx.opts }
  }

  _initPeer () {
    this.peer = new PeerRPCServer(this.link, {})

    this.peer.init()
  }

  _initTransport () {
    this.transport = this.peer.transport('server')

    this.transport.listen(this.wsPort)
  }

  _announceOne (
    key,
    resolve = () => {},
    reject = () => {}
  ) {
    this.link.announce(key, this.transport.port, {}, (err) => {
      if (err) {
        reject(err)

        console.error(err)
      }

      resolve()
    })
  }

  _announce () {
    const {
      services = [],
      tickInterval = 45000
    } = { ...this.opts }

    return services.reduce(async (accum, srv) => {
      await accum

      return new Promise((resolve, reject) => {
        const key = `${srv}:ws`

        this._announceItv = setInterval(() => {
          this._announceOne(key)
        }, tickInterval)

        this._announceOne(key, resolve, reject)
      })
    }, Promise.resolve())
  }

  _initRPC () {
    this.transport.on('request', (rid, key, payload, { reply }) => {
      const _payload = { ...payload }
      const { method = '' } = _payload
      const args = omit(_payload, ['method'])

      if (
        typeof this.rService[method] !== 'function' ||
        /^_/.test(method)
      ) {
        reply(new FindMethodError())

        return
      }

      const fn = this.rService[method].bind(this.rService)

      fn(null, args, reply)
    })
  }

  // TODO:
  _justForTest () {
    const wsEventEmmiter = new WSEventEmmiter()

    let i = 0

    setInterval(() => {
      wsEventEmmiter.emmitProgress({ progress: ++i })
    }, 1000)
  }

  async start () {
    this._initPeer()
    this._initTransport()
    await this._announce()

    WSEventEmmiter.inject({ transport: this.transport })

    this._initRPC()
    this._justForTest() // TODO:
  }

  stop (cb) {
    clearInterval(this._announceItv)

    this.peer.stop()
    this.transport.stop()

    cb()
  }
}

module.exports = WSTransport
