'use strict'

module.exports = (grcBfxReq) => {
  return async (
    emailConf,
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

      const mailOptions = {
        lang: language ?? 'en',
        to,
        from: emailConf?.from,
        reportUrl,
        fileName,
        signatureS3,
        isUnauth
      }

      return grcBfxReq({
        service: 'rest:core:mail',
        action: 'enqueueEmail',
        args: [mailOptions]
      })
    })

    return Promise.all(promises)
  }
}
