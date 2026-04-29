'use strict'

const fs = require('fs')

const {
  getCompleteFileName,
  getReportContentType
} = require('../helpers')

module.exports = (
  {
    isCompress,
    isAddedUniqueEndingToReportFileName
  },
  deflateFac,
  grcBfxReq
) => {
  return async (
    configs,
    filePaths,
    queueName,
    subParamsArr,
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

      const reportS3 = await grcBfxReq({
        service: 'rest:ext:s3',
        action: 'uploadPresigned',
        args: [hexStrBuff, opts]
      })

      return {
        ...reportS3,
        fileName
      }
    })

    return Promise.all(promises)
  }
}
