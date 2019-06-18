'use strict'

const uuid = require('uuid')

let deps = {}

class WSEventEmmiter {
  constructor (inDeps) {
    this.deps = { ...deps, ...inDeps }
    this._active = false
    this._sockets = new Map()

    this.listen()
  }

  static inject (inDeps) {
    deps = { ...deps, ...inDeps }
  }

  listen () {
    this.deps.transport.socket.on('connection', socket => {
      this._active = true

      const sid = socket._grc_id = uuid.v4()

      this._sockets.set(sid, socket)
      console.log('[connection]')

      socket.on('close', () => {
        console.log('[2-close]')
        this._sockets.delete(sid)
      })
      socket.on('message', (data) => {
        console.log('[mess:data]:', data)
      })
    })

    this.deps.transport.socket.on('close', () => {
      console.log('[1-close]')
      this._active = false
    })
  }

  send (action, err, data) {
    if (!this._active) {
      return false
    }

    this._sockets.forEach(socket => {
      const sData = this.deps.transport.format(
        [socket._grc_id, err ? err.message : null, { action, data }]
      )

      console.log('[sData]:', sData)

      socket.send(sData)
    })

    return true
  }

  emmitProgress (data) {
    return this.send('progress', null, data)
  }
}

module.exports = WSEventEmmiter
