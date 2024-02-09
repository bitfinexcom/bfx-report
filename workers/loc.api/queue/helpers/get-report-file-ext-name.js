'use strict'

module.exports = (params) => {
  const {
    isPDFRequired,
    isHTMLRequired
  } = params ?? {}

  if (isPDFRequired) {
    return 'pdf'
  }
  if (isHTMLRequired) {
    return 'html'
  }

  return 'csv'
}
