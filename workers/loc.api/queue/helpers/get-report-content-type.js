'use strict'

module.exports = (params) => {
  const {
    isCompress,
    isPDFRequired
  } = params ?? {}

  if (isCompress) {
    return 'application/zip'
  }
  if (isPDFRequired) {
    return 'application/pdf'
  }

  return 'text/csv'
}
