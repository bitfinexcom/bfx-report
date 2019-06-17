'use strict'

const { omit } = require('lodash')
const { PeerRPCServer } = require('grenache-nodejs-ws')

const { FindMethodError } = require('../errors')
const WSEventEmmiter = require('./ws.event.emmiter')

module.exports = async ({
  grc_bfx: grcBfx,
  group,
  conf = {}
} = {}) => {
  const { wsPort } = { ...conf[group] }
  const link = grcBfx.link
  const rService = grcBfx.api
  const { services } = { ...grcBfx.opts }

  const peer = new PeerRPCServer(link, {})
  peer.init()

  const transport = peer.transport('server')
  transport.listen(wsPort)

  await services.reduce(async (accum, srv) => {
    await accum

    return new Promise((resolve, reject) => {
      link.announce(`${srv}:ws`, transport.port, {}, (err) => {
        if (err) reject(err)

        resolve()
      })
    })
  }, Promise.resolve())

  WSEventEmmiter.inject({
    transport
  })

  void (new WSEventEmmiter()) // TODO:

  transport.on('request', (rid, key, payload, { reply }) => {
    const _payload = { ...payload }
    const { method = '' } = _payload
    const args = omit(_payload, ['method'])

    if (
      typeof rService[method] !== 'function' ||
      /^_/.test(method)
    ) {
      reply(new FindMethodError())

      return
    }

    const fn = rService[method].bind(rService)

    fn(null, args, reply)
  })

  return transport
}
