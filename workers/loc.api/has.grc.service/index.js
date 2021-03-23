'use strict'

const { promisify } = require('util')
const {
  decorate,
  injectable,
  inject
} = require('inversify')

const TYPES = require('../di/types')

class HasGrcService {
  constructor (link) {
    this.link = link
  }

  async lookUpFunction (service) {
    const lookup = promisify(this.link.lookup)
      .bind(this.link)

    try {
      const res = await lookup(service)

      return Array.isArray(res)
        ? res.length
        : 0
    } catch (err) {
      return 0
    }
  }

  async hasS3AndSendgrid () {
    const countS3Services = await this.lookUpFunction(
      'rest:ext:s3'
    )
    const countSendgridServices = await this.lookUpFunction(
      'rest:ext:sendgrid'
    )

    return !!(countS3Services && countSendgridServices)
  }

  async hasGPGService () {
    const countPGPServices = await this.lookUpFunction(
      'rest:ext:gpg'
    )

    return !!countPGPServices
  }
}

decorate(injectable(), HasGrcService)
decorate(inject(TYPES.Link), HasGrcService, 0)

module.exports = HasGrcService
