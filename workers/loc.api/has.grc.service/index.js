'use strict'

const {
  decorate,
  injectable,
  inject
} = require('inversify')

const TYPES = require('../di/types')

class HasGrcService {
  constructor (rService) {
    this.rService = rService
  }

  async hasS3AndSendgrid () {
    const countS3Services = await this.rService.lookUpFunction(
      null,
      { params: { service: 'rest:ext:s3' } }
    )
    const countSendgridServices = await this.rService.lookUpFunction(
      null,
      { params: { service: 'rest:ext:sendgrid' } }
    )

    return !!(countS3Services && countSendgridServices)
  }

  async hasGPGService () {
    const countPGPServices = await this.rService.lookUpFunction(
      null,
      { params: { service: 'rest:ext:gpg' } }
    )

    return !!countPGPServices
  }
}

decorate(injectable(), HasGrcService)
decorate(inject(TYPES.RService), HasGrcService, 0)

module.exports = HasGrcService
