'use strict'

const Backend = require('i18next-fs-backend')
const { merge, min } = require('lib-js-util-base')

/**
 * Extend the main fs Backend to provide the ability
 * to load and merge translations in bfx-reports-framework
 */
class FsMultilocationBackend extends Backend {
  async read (language, namespace, callback) {
    try {
      const loadPaths = this.options.loadPaths
      const errors = []
      const dataArr = []
      const timestamps = []

      for (const loadPath of loadPaths) {
        this.options.loadPath = loadPath

        await new Promise((resolve) => {
          super.read(language, namespace, (err, data, timestamp) => {
            if (err) {
              errors.push(err)
              resolve()

              return
            }
            if (data) {
              dataArr.push(data)
            }
            if (timestamp) {
              timestamps.push(timestamp)
            }

            resolve()
          })
        })
      }

      if (loadPaths.length === errors.length) {
        callback(errors[0], false)

        return
      }

      callback(
        null,
        merge({}, ...dataArr),
        min(timestamps)
      )
    } catch (err) {
      callback(err, false)
    }
  }
}

module.exports = FsMultilocationBackend
