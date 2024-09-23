'use strict'

const i18next = require('i18next')
const { merge } = require('lib-js-util-base')
const path = require('path')
const fs = require('fs')

const FsMultilocationBackend = require('./fs.multilocation.backend')
const TRANSLATION_NAMESPACES = require('./translation.namespaces')

let i18nextInstance = null

module.exports = (params) => {
  if (i18nextInstance) {
    return i18nextInstance
  }

  const {
    i18nextConfigs,
    transPaths
  } = params ?? {}

  const configs = merge(
    {
      fallbackLng: 'en',
      ns: Object.values(TRANSLATION_NAMESPACES),
      defaultNS: 'email',
      preload: [...transPaths.reduce((accum, transPath) => {
        const allFileNames = fs.readdirSync(transPath)

        for (const fileName of allFileNames) {
          const filePath = path.join(transPath, fileName)
          const stats = fs.lstatSync(filePath)

          if (!stats.isDirectory()) {
            continue
          }

          accum.add(fileName)
        }

        return accum
      }, new Set())],
      backend: {
        loadPaths: transPaths.map((transPath) => (
          path.join(transPath, '{{lng}}/{{ns}}.json')
        ))
      }
    },
    i18nextConfigs
  )

  const promise = i18next
    .use(FsMultilocationBackend)
    .init(configs)
  i18nextInstance = i18next

  return promise.then(() => i18next)
}
