'use strict'

const { assert } = require('chai')
const fs = require('fs')

const testProcQueue = (procRes) => {
  assert.isObject(procRes)
  assert.containsAllKeys(procRes, [
    'userInfo',
    'userId',
    'name',
    'email',
    'filePaths',
    'subParamsArr',
    'isUnauth'
  ])
  assert.isObject(procRes.userInfo)
  assert.isString(procRes.userInfo.username)
  assert.isString(procRes.userInfo.email)
  assert.isNumber(procRes.userInfo.userId)
  assert.isString(procRes.name)
  assert.isString(procRes.email)
  assert.isArray(procRes.filePaths)
  procRes.filePaths.forEach(filePath => {
    assert.isString(filePath)
    assert.isOk(fs.existsSync(filePath))
  })
  assert.isArray(procRes.subParamsArr)
  procRes.subParamsArr.forEach(params => assert.isObject(params))
  assert.isBoolean(procRes.isUnauth)
}

const testMethodOfGettingCsv = async (procPromise, aggrPromise, res) => {
  assert.isObject(res.body)
  assert.propertyVal(res.body, 'id', 5)
  assert.isObject(res.body.result)
  assert.isOk(res.body.result.isSendEmail || res.body.result.isSaveLocaly)

  const procRes = await procPromise

  testProcQueue(procRes)

  await aggrPromise

  procRes.filePaths.forEach(filePath => {
    assert.isNotOk(fs.existsSync(filePath))
  })
}

module.exports = {
  testMethodOfGettingCsv,
  testProcQueue
}
