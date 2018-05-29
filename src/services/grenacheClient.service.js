'use strict'

const Grenache = require('grenache-nodejs-http')
const Link = require('grenache-nodejs-link')
const config = require('config')
const { CustomLogger } = require('./log.service')

const logger = new CustomLogger({
  label: ':grenache:client'
}).createLogger()

_checkConf()

const gClientConf = config.get('grenacheClient')

const Peer = Grenache.PeerRPCClient

const link = new Link({
  grape: gClientConf.grape
})

link.start()

const peer = new Peer(link, {})

peer.init()

function _checkConf () {
  if (
    config.has('grenacheClient')
    && config.has('grenacheClient.grape')
    && config.has('grenacheClient.query')
    && config.has('grenacheClient.timeout')
  ) {
    return
  }

  const err = new Error('ERR_CONFIG_ARGS_NO_GRENACHE_CLIENT')

  logger.error('Found %s at %s', 'error', err)

  throw err
}

// const _request = (query, ...args) => {
//   const _args = []

//   if (typeof args[0] === 'function') {
//     _args[0] = { timeout: gClientConf.timeout }
//     _args[1] = args[0]
//   }

//   if (typeof args[0] === 'object') {
//     _args = [...args]
//   }
  
//   peer.request(gClientConf.query, query, _args[0], (err, data) => {
//     if (err) {
//       logger.debug('Found %s at %s', 'error', err)
//     }

//     _args[1](err, data)
//   })
// }

const request = (query, ...args) => {
  const _args = []

  if (typeof args[0] === 'function') {
    _args[0] = { timeout: gClientConf.timeout }
    _args[1] = args[0]
  }

  if (typeof args[0] === 'object') {
    _args = [...args]
  }

  return new Promise((resolve, reject) => {
    peer.request(gClientConf.query, query, _args[0], (err, data) => {
      if (err) {
        logger.debug('Found %s at %s', 'error', err)
        reject(err)

        return
      }
  
      resolve(data)
    })
  })
}

module.exports = {
  request
}
