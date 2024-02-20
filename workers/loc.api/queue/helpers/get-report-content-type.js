'use strict'

module.exports = (params) => {
  const {
    isСompress,
    isPDFRequired
  } = params ?? {}

  if (isСompress) {
    return 'application/zip'
  }
  if (isPDFRequired) {
    return 'application/pdf'
  }

  return 'text/csv'
}
