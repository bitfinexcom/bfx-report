'use strict'

const spawn = require('child_process').spawn
const path = require('path')
const chai = require('chai')
const request = require('supertest')
const config = require('config')

const { bootTwoGrapes, killGrapes } = require('./helpers').grenacheHelper
const { app } = require('../app')
const agent = request.agent(app)
const assert = chai.assert

let rpc = null
let grapes = null
let auth = null

const _checkConf = () => {
  if (
    config.has('auth') &&
    config.has('auth.apiKey') &&
    config.has('auth.apiSecret')
  ) {
    return
  }

  const err = new Error('ERR_CONFIG_ARGS_NO_AUTH')

  throw err
}

describe('API', () => {
  before(function (done) {
    this.timeout(20000)

    _checkConf()
    auth = config.get('auth')

    bootTwoGrapes((err, g) => {
      if (err) throw err

      grapes = g
      grapes[0].once('announce', msg => {
        done()
      })

      const f = path.join(__dirname, '..', 'worker.js')
      rpc = spawn('node', [
        f,
        '--env=development',
        '--wtype=wrk-report-service-api',
        '--apiPort=1338'
      ])
      rpc.stdout.on('data', d => {
        console.log(d.toString())
      })
      rpc.stderr.on('data', d => {
        console.log(d.toString())
      })
    })
  })

  after(function (done) {
    this.timeout(5000)
    rpc.on('close', () => {
      killGrapes(grapes, done)
    })
    rpc.kill()
  })

  it('it should be successfully auth', function (done) {
    this.timeout(5000)
    agent
      .post('/check-auth')
      .type('json')
      .send({
        auth,
        id: 5
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err)

        assert.isObject(res.body)
        assert.propertyVal(res.body, 'result', true)
        assert.propertyVal(res.body, 'id', 5)

        done()
      })
  }).timeout(60000)

  it('it should not be successfully auth', function (done) {
    this.timeout(5000)
    agent
      .post('/check-auth')
      .type('json')
      .send({
        auth: {
          apiKey: '---',
          apiSecret: '---'
        }
      })
      .expect('Content-Type', /json/)
      .expect(401)
      .end((err, res) => {
        if (err) return done(err)

        assert.isObject(res.body)
        assert.isObject(res.body.error)
        assert.propertyVal(res.body.error, 'code', 401)
        assert.propertyVal(res.body.error, 'message', 'Unauthorized')
        assert.propertyVal(res.body, 'id', null)

        done()
      })
  }).timeout(60000)
})
