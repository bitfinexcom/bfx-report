'use strict'

const uuid = require('uuid')
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

    this._active = false
    this._sockets = new Map()
    this._auth = new Map()
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

  _listen () {
    this.transport.socket.on('connection', socket => {
      this._active = true

      const sid = socket._grc_id = uuid.v4()

      this._sockets.set(sid, socket)

      socket.on('close', () => {
        this._auth.delete(sid)
        this._sockets.delete(sid)
      })
      socket.on('message', async (data) => {
        try {
          const _data = this.transport.parse(data)

          if (!Array.isArray(_data)) {
            return
          }

          const res = _data[2]

          if (
            !res ||
            typeof res !== 'object' ||
            res.method !== 'login' ||
            !res.auth ||
            typeof res.auth !== 'object'
          ) {
            return
          }

          await this.rService.login(null, { auth: res.auth })

          this._auth.set(sid, res.auth)
        } catch (err) {}
      })
    })

    this.transport.socket.on('close', () => {
      this._active = false
    })
  }

  _sendToOne (socket, sid, action, err, data) {
    const res = this.transport.format(
      [sid, err ? err.message : null, { action, data }]
    )

    socket.send(res)
  }

  async send (handler, action) {
    if (
      !this._active ||
      this._auth.size === 0
    ) {
      return false
    }

    for (const [sid, socket] of this._sockets) {
      if (!this._auth.has(sid)) {
        continue
      }

      const auth = this._auth.get(sid)

      try {
        const res = await handler(auth)

        this._sendToOne(socket, sid, action, null, res)
      } catch (err) {
        this._sendToOne(socket, sid, action, err)
      }
    }

    return true
  }

  // TODO:
  _justForTest () {
    const wsEventEmmiter = new WSEventEmmiter()

    let i = 0

    setInterval(() => {
      wsEventEmmiter.emmitProgress((auth) => {
        return { progress: ++i }
      })
    }, 1000)
  }

  async start () {
    this._initPeer()
    this._initTransport()
    this._listen()
    await this._announce()

    WSEventEmmiter.inject({ wsTransport: this })

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
