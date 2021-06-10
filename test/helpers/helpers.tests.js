'use strict'

const { assert } = require('chai')
const fs = require('fs')

const testProcQueue = (procRes, opts) => {
  const { isSendEmail } = { ...opts }

  const procResKeys = [
    'userInfo',
    'userId',
    'name',
    'filePaths',
    'subParamsArr',
    'isUnauth'
  ]

  if (isSendEmail) {
    procResKeys.push('email')
  }

  assert.isObject(procRes)
  assert.containsAllKeys(procRes, procResKeys)
  assert.isObject(procRes.userInfo)
  assert.isString(procRes.userInfo.username)
  assert.isString(procRes.userInfo.email)
  assert.isNumber(procRes.userInfo.userId)
  assert.isString(procRes.name)

  if (isSendEmail) {
    assert.isString(procRes.email)
  }

  assert.isArray(procRes.filePaths)
  procRes.filePaths.forEach(filePath => {
    assert.isString(filePath)
    assert.isOk(fs.existsSync(filePath))
  })
  assert.isArray(procRes.subParamsArr)
  procRes.subParamsArr.forEach(params => assert.isObject(params))
  assert.isBoolean(procRes.isUnauth)
}

const testMethodOfGettingCsv = async (
  procPromise,
  aggrPromise,
  res,
  extraTestCase = () => {}
) => {
  assert.isObject(res.body)
  assert.propertyVal(res.body, 'id', 5)
  assert.isObject(res.body.result)
  assert.isOk(res.body.result.isSendEmail || res.body.result.isSaveLocaly)

  const procRes = await procPromise

  testProcQueue(
    procRes,
    { isSendEmail: res.body.result.isSendEmail }
  )

  const aggrRes = await aggrPromise

  procRes.filePaths.forEach(filePath => {
    assert.isNotOk(fs.existsSync(filePath))
  })

  if (res.body.result.isSaveLocaly) {
    assert.isObject(aggrRes)
    assert.isArray(aggrRes.newFilePaths)
    assert.isAtLeast(aggrRes.newFilePaths.length, 1)

    aggrRes.newFilePaths.forEach((newFilePath) => {
      assert.isOk(fs.existsSync(newFilePath))
    })
  }

  extraTestCase({
    procRes,
    aggrRes,
    result: res.body.result
  })
}

module.exports = {
  testMethodOfGettingCsv,
  testProcQueue
}
