'use strict'

const { promisify } = require('util')

const { decorateInjectable } = require('../di/utils')

const depsTypes = (TYPES) => [
  TYPES.Link,
  TYPES.GrcSlackFac
]
class HasGrcService {
  constructor (link, grcSlackFac) {
    this.link = link
    this.grcSlackFac = grcSlackFac
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

  async hasSlackService () {
    const workerName = (
      this.grcSlackFac.conf &&
      typeof this.grcSlackFac.conf === 'object' &&
      this.grcSlackFac.conf.worker
    )
      ? this.grcSlackFac.conf.worker
      : 'rest:ext:slack'

    const countSlackService = await this.lookUpFunction(
      workerName
    )

    return !!countSlackService
  }
}

decorateInjectable(HasGrcService, depsTypes)

module.exports = HasGrcService
