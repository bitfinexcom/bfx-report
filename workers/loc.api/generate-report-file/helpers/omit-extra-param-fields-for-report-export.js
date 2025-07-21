'use strict'

const { omit } = require('lib-js-util-base')

module.exports = (params) => {
  return omit(params ?? {}, [
    'dateFormat',
    'milliseconds',
    'language',
    'isPDFRequired',
    'method',
    'timezone',
    'email',
    'isSignatureRequired',
    'isDeposits',
    'isWithdrawals',
    'isTradingPair',
    'isBaseNameInName'
  ])
}
