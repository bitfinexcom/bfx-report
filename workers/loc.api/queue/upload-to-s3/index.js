'use strict'

const fs = require('fs')
const { Readable } = require('stream')

const {
  getCompleteFileName,
  getReportContentType
} = require('../helpers')

const _uploadSignToS3 = async (
  isCompress,
  deflateFac,
  grcBfxReq,
  configs,
  signature,
  fileNameWithoutExt
) => {
  const fileName = `SIGNATURE_${fileNameWithoutExt}.sig`
  const signFileName = isCompress
    ? `SIGNATURE_${fileNameWithoutExt}.zip`
    : fileName

  const stream = new Readable()
  stream._read = () => {}
  stream.push(signature)
  stream.push(null)
  const signStream = {
    stream,
    data: { name: fileName }
  }

  const signBuffers = await Promise.all(deflateFac.createBuffZip(
    [signStream],
    isCompress,
    {
      comment: `SIGNATURE_${fileNameWithoutExt.replace(/_/g, ' ')}`
    }
  ))

  const signHexStrBuff = signBuffers[0].toString('hex')
  const signOpts = {
    ...configs,
    contentDisposition: `attachment; filename="${signFileName}"`,
    contentType: isCompress
      ? 'application/zip'
      : 'application/pgp-signature'
  }

  return grcBfxReq({
    service: 'rest:ext:s3',
    action: 'uploadPresigned',
    args: [signHexStrBuff, signOpts]
  })
}

module.exports = (
  {
    isCompress,
    isAddedUniqueEndingToReportFileName
  },
  deflateFac,
  hasGrcService,
  grcBfxReq
) => {
  return async (
    configs,
    filePaths,
    queueName,
    subParamsArr,
    isSignatureRequired,
    userInfo,
    streamSet
  ) => {
    const isMultiExport = (
      queueName === 'getMultiple' ||
      (
        Array.isArray(subParamsArr) &&
        subParamsArr.length > 1
      )
    )
    const { fileName: fileNameWithoutExt } = getCompleteFileName(
      subParamsArr[0].name,
      subParamsArr[0],
      {
        userInfo: userInfo.username,
        ext: false,
        isMultiExport,
        isAddedUniqueEndingToReportFileName
      }
    )
    const isUppedPGPService = await hasGrcService.hasGPGService()
    const isSignReq = isSignatureRequired && isUppedPGPService

    const streams = filePaths.map((filePath, i) => {
      const stream = fs.createReadStream(filePath)
      streamSet.add(stream)

      return {
        stream,
        data: {
          name: getCompleteFileName(
            subParamsArr[i].name,
            subParamsArr[i],
            {
              userInfo: userInfo.username,
              isAddedUniqueEndingToReportFileName
            }
          ).fileName
        }
      }
    })
    const buffers = await Promise.all(deflateFac.createBuffZip(
      streams,
      isCompress,
      {
        comment: fileNameWithoutExt.replace(/_/g, ' ')
      }
    ))

    const promises = buffers.map(async (buffer, i) => {
      const ext = isCompress ? 'zip' : ''
      const singleFileName = isCompress
        ? streams[i].data.name.slice(0, -3)
        : streams[i].data.name
      const fileName = isCompress && isMultiExport
        ? `${fileNameWithoutExt}.zip`
        : `${singleFileName}${ext}`
      const opts = {
        ...configs,
        contentDisposition: `attachment; filename="${fileName}"`,
        contentType: getReportContentType({
          isCompress,
          isPDFRequired: subParamsArr[i].isPDFRequired
        })
      }
      const hexStrBuff = buffer.toString('hex')

      const signature = isSignReq
        ? await grcBfxReq({
          service: 'rest:ext:gpg',
          action: 'getDigitalSignature',
          args: [hexStrBuff, userInfo]
        })
        : null
      const reportS3 = await grcBfxReq({
        service: 'rest:ext:s3',
        action: 'uploadPresigned',
        args: [hexStrBuff, opts]
      })

      if (isSignReq) {
        const signatureS3 = await _uploadSignToS3(
          isCompress,
          deflateFac,
          grcBfxReq,
          configs,
          signature,
          fileNameWithoutExt
        )

        return {
          ...reportS3,
          fileName,
          signatureS3
        }
      }

      return {
        ...reportS3,
        fileName
      }
    })

    return Promise.all(promises)
  }
}
