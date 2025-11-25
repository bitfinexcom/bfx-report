'use strict'

module.exports = (grcBfxReq) => {
  return async (
    to,
    dataArr
  ) => {
    const promises = dataArr.map(data => {
      const {
        presigned_url: reportUrl,
        language,
        fileName,
        isUnauth,
        signatureS3
      } = data ?? {}

      const payload = {
        lang: language ?? 'en',
        to,
        reportUrl,
        fileName,
        signatureS3,
        isUnauth
      }

      return grcBfxReq({
        service: 'rest:core:mail',
        action: 'enqueueEmail',
        args: [{ type: 'reportDownloadReady', payload }]
      })
    })

    return Promise.all(promises)
  }
}
