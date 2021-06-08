'use strict'

const fs = require('fs')
const { Readable } = require('stream')

const { getCompleteFileName } = require('../helpers')

const _uploadSignToS3 = async (
  isСompress,
  deflateFac,
  grcBfxReq,
  configs,
  signature,
  fileNameWithoutExt
) => {
  const fileName = `SIGNATURE_${fileNameWithoutExt}.sig`
  const signFileName = isСompress
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
    isСompress,
    {
      comment: `SIGNATURE_${fileNameWithoutExt.replace(/_/g, ' ')}`
    }
  ))

  const signHexStrBuff = signBuffers[0].toString('hex')
  const signOpts = {
    ...configs,
    contentDisposition: `attachment; filename="${signFileName}"`,
    contentType: isСompress
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
    isСompress,
    isAddedUniqueEndingToCsvName
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
    userInfo
  ) => {
    const isMultiExport = (
      queueName === 'getMultiple' ||
      (
        Array.isArray(subParamsArr) &&
        subParamsArr.length > 1
      )
    )
    const fileNameWithoutExt = getCompleteFileName(
      subParamsArr[0].name,
      subParamsArr[0],
      {
        userInfo: userInfo.username,
        ext: false,
        isMultiExport,
        isAddedUniqueEndingToCsvName
      }
    )
    const isUppedPGPService = await hasGrcService.hasGPGService()
    const isSignReq = isSignatureRequired && isUppedPGPService

    const streams = filePaths.map((filePath, i) => {
      return {
        stream: fs.createReadStream(filePath),
        data: {
          name: getCompleteFileName(
            subParamsArr[i].name,
            subParamsArr[i],
            {
              userInfo: userInfo.username,
              isAddedUniqueEndingToCsvName
            }
          )
        }
      }
    })
    const buffers = await Promise.all(deflateFac.createBuffZip(
      streams,
      isСompress,
      {
        comment: fileNameWithoutExt.replace(/_/g, ' ')
      }
    ))

    const promises = buffers.map(async (buffer, i) => {
      const fileName = isСompress && isMultiExport
        ? `${fileNameWithoutExt}.zip`
        : `${streams[i].data.name.slice(0, -3)}${isСompress ? 'zip' : 'csv'}`
      const opts = {
        ...configs,
        contentDisposition: `attachment; filename="${fileName}"`,
        contentType: isСompress ? 'application/zip' : 'text/csv'
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
          isСompress,
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
