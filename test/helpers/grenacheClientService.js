'use strict'

const { PeerRPCClient } = require('grenache-nodejs-http')
const Link = require('grenache-nodejs-link')

const configRequest = (grape, grcServices) => {
  const link = new Link({ grape })
  link.start()

  const peer = new PeerRPCClient(link, {})
  peer.init()

  return (query, res) => {
    const timeout = { timeout: 10000 }

    return new Promise((resolve, reject) => {
      peer.request(grcServices, query, timeout, (err, data) => {
        if (err) reject(err)
        else resolve(data)
      })
    })
  }
}

module.exports = configRequest
