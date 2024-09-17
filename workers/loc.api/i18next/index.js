'use strict'

const i18next = require('i18next')
const { merge } = require('lib-js-util-base')
const path = require('path')
const fs = require('fs')

const FsMultilocationBackend = require('./fs.multilocation.backend')

module.exports = async (params) => {
  const {
    i18nextConfigs,
    transPaths
  } = params ?? {}

  const configs = merge(
    {
      fallbackLng: 'en',
      ns: ['email', 'pdf'],
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

  await i18next
    .use(FsMultilocationBackend)
    .init(configs)

  return i18next
}
