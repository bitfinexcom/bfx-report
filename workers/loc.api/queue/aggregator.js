'use strict'

const { promisify } = require('util')
const fs = require('fs')

const unlink = promisify(fs.unlink)

const {
  moveFileToLocalStorage
} = require('./helpers')

module.exports = (
  { isAddedUniqueEndingToCsvName },
  rootPath,
  aggregatorQueue,
  hasGrcService,
  uploadToS3,
  sendMail
) => {
  return async (job) => {
    try {
      const {
        chunkCommonFolders,
        userInfo,
        name,
        filePaths,
        subParamsArr,
        isSignatureRequired,
        email,
        isUnauth,
        s3Conf,
        emailConf,
        language
      } = job.data

      const isEnableToSendEmail = (
        typeof email === 'string' &&
        await hasGrcService.hasS3AndSendgrid()
      )

      const newFilePaths = []
      const csvFilesMetadata = []

      if (isEnableToSendEmail) {
        const s3Data = await uploadToS3(
          s3Conf,
          filePaths,
          name,
          subParamsArr,
          isSignatureRequired,
          {
            ...userInfo,
            email
          }
        )

        await sendMail(
          emailConf,
          email,
          'email.pug',
          s3Data.map((item, i) => ({
            ...item,
            isUnauth,
            language
          }))
        )

        for (const [i, filePath] of filePaths.entries()) {
          const _name = subParamsArr[i]?.name ?? name

          await unlink(filePath)

          csvFilesMetadata.push({
            name: _name,
            filePath: null
          })
        }

        job.done()
        aggregatorQueue.emit('completed', {
          newFilePaths,
          csvFilesMetadata,
          userInfo
        })

        return
      }

      for (const [i, filePath] of filePaths.entries()) {
        const _name = subParamsArr[i]?.name ?? name

        const {
          newFilePath
        } = await moveFileToLocalStorage(
          rootPath,
          filePath,
          _name,
          { ...subParamsArr[i] },
          userInfo.username,
          isAddedUniqueEndingToCsvName,
          chunkCommonFolders[i]
        )

        newFilePaths.push(newFilePath)
        csvFilesMetadata.push({
          name: _name,
          filePath: newFilePath
        })
      }

      job.done()
      aggregatorQueue.emit('completed', {
        newFilePaths,
        csvFilesMetadata,
        userInfo
      })
    } catch (err) {
      if (err.syscall === 'unlink') {
        aggregatorQueue.emit('error:unlink', job)
        job.done()
      } else {
        try {
          for (const filePath of job.data.filePaths) {
            await unlink(filePath)
          }
        } catch (e) {
          aggregatorQueue.emit('error:unlink', job)
        }

        job.done(err)
      }

      aggregatorQueue.emit('error:base', err, job)
    }
  }
}
