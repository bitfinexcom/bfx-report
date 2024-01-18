'use strict'

module.exports = (params) => {
  const {
    isPDFRequired
  } = params ?? {}

  if (isPDFRequired) {
    return 'pdf'
  }

  return 'csv'
}
