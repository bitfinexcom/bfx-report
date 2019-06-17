'use strict'

const uuid = require('uuid')

let deps = {}

class WSEventEmmiter {
  constructor (inDeps) {
    this.deps = { ...deps, ...inDeps }
    this._active = false
    this._sockets = new Map()

    // TODO:
    let i = 0

    setInterval(() => {
      this.emmitProgress({ progress: ++i })

      console.log('[progress]:', { progress: i })
    }, 1000)
  }

  static inject (inDeps) {
    deps = { ...deps, ...inDeps }
  }

  listen () {
    this.deps.transport.socket.on('connection', socket => {
      this._active = true

      const sid = socket._grc_id = uuid.v4()

      this._sockets.set(sid, socket)

      socket.on('close', () => {
        this._sockets.delete(sid)
      })
    })

    this.deps.transport.socket.on('close', () => {
      this._active = false
    })
  }

  send (action, data) {
    if (this._active) {
      return false
    }

    const sData = this.deps.transport.format(
      { action, data }
    )

    this._sockets.forEach(socket => {
      socket.send(sData)
    })

    return true
  }

  emmitProgress (data) {
    return this.send('progress', data)
  }
}

module.exports = WSEventEmmiter
