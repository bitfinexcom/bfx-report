'use strict'

const fs = require('fs')
const path = require('path')
const { assert } = require('chai')

require('reflect-metadata')
const responder = require('../index')
const AbstractWSEventEmitter = require('../../abstract.ws.event.emitter')

const JSON_RPC_VERSION = '2.0'
const name = 'mockedResponderCall'
const args = { id: 5 }
const mockedHtmlBody403 = fs.readFileSync(path.join(
  __dirname, 'mockedHtmlBody403.html'
))

const _makeApiError = (resp, rawBody) => {
  const err = new Error(`HTTP code ${resp.status} ${resp.statusText || ''}`)
  err.status = resp.status
  err.statustext = resp.statusText
  try {
    const [, code, response] = JSON.parse(rawBody)
    err.code = code
    err.response = response
  } catch (_err) {
    err.response = rawBody
  }

  return err
}

describe('Responder service', () => {
  let mockedResponder = null

  before(function () {
    const mockedContainer = {}
    const mockedLogger = {
      debug (message) {
        assert.isString(message)
      },
      error (message) {
        assert.isString(message)
      }
    }
    const mockedWsEventEmitterFactory = () => new (class WSEventEmitter extends AbstractWSEventEmitter {
      emitBfxUnamePwdAuthRequiredToOne (data, auth) {
        assert.isObject(data)
        assert.isObject(auth)
      }
    })()

    mockedResponder = responder(
      mockedContainer,
      mockedLogger,
      mockedWsEventEmitterFactory
    )
  })

  it('handle HTML error', async function () {
    await mockedResponder(async () => {
      throw _makeApiError({
        status: 403,
        statustext: 'Forbidden'
      }, mockedHtmlBody403)
    }, name, args, (err, res) => {
      assert.isNull(err)

      assert.isObject(res)
      assert.propertyVal(res, 'id', 5)
      assert.propertyVal(res, 'jsonrpc', JSON_RPC_VERSION)
      assert.isObject(res.error)
      assert.propertyVal(res.error, 'code', 403)
      assert.propertyVal(res.error, 'message', 'Forbidden')
      assert.isObject(res.error.data)
      assert.isObject(res.error.data.bfxApiErrorMessage)

      assert.containsAllKeys(res.error.data.bfxApiErrorMessage, [
        'bfxApiStatus',
        'bfxApiStatusText',
        'bfxApiRawBodyCode',
        'isBfxApiRawBodyResponseHtml',
        'bfxApiRawBodyResponse'
      ])
    })
  })
})
