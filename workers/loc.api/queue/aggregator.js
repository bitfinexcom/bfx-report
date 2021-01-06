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
        chunkCommonFolder,
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

        for (const filePath of filePaths) {
          await unlink(filePath)
        }
      } else {
        let count = 0

        for (const filePath of filePaths) {
          await moveFileToLocalStorage(
            rootPath,
            filePath,
            subParamsArr[count].name || name,
            { ...subParamsArr[count] },
            userInfo.username,
            isAddedUniqueEndingToCsvName,
            chunkCommonFolder
          )

          count += 1
        }
      }

      job.done()
      aggregatorQueue.emit('completed')
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
