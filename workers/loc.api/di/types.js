'use strict'

module.exports = {
  CONF: Symbol.for('CONF'),
  Container: Symbol.for('Container'),
  LoggerFactory: Symbol.for('LoggerFactory'),
  Logger: Symbol.for('Logger'),
  RService: Symbol.for('RService'),
  Responder: Symbol.for('Responder'),
  GetREST: Symbol.for('GetREST'),
  InjectDepsToRService: Symbol.for('InjectDepsToRService'),
  GrcBfxReq: Symbol.for('GrcBfxReq'),
  PrepareResponse: Symbol.for('PrepareResponse'),
  PrepareApiResponse: Symbol.for('PrepareApiResponse')
}
