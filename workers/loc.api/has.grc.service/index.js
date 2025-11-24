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

  async hasS3AndMailServices () {
    const countS3Services = await this.lookUpFunction(
      'rest:ext:s3'
    )
    const countMailServices = await this.lookUpFunction(
      'rest:core:mail'
    )

    return !!(countS3Services && countMailServices)
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

  async hasPDFService () {
    const countPDFServices = await this.lookUpFunction(
      'rest:ext:pdf'
    )

    return !!countPDFServices
  }
}

decorateInjectable(HasGrcService, depsTypes)

module.exports = HasGrcService
