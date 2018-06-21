'use strict'

const { promisify } = require('util')

// TODO:
const _getFullData = async (
  reportService,
  { method, args, propName = 'mts' }
) => {
  if (typeof reportService[method] !== 'function') {
    throw new Error('ERR_METHOD_NOT_FOUND')
  }

  const data = []
  const getData = promisify(reportService[method])
  const res = await getData(null, args)

  if (!res || !Array.isArray(res) || res.length === 0) {
    return Promise.resolve(data)
  }

  data.push(...res)

  if (
    typeof data[data.length - 1] === 'object' &&
    data[data.length - 1][propName] &&
    Number.isInteger(data[data.length - 1][propName])
  ) {
    console.log('---Data length---', data.length) // TODO:

    args.params.end = data[data.length - 1][propName] - 1

    const subRes = await _getFullData(reportService, { method, args, propName })

    data.push(...subRes)
  }

  console.log('---Total data length---', data.length) // TODO:

  return Promise.resolve(data)
}

module.exports = (reportService, job) => {
  return _getFullData(reportService, job.data)
}
