'use strict'

const ApiMiddlewareHandlerAfter = require('./api.middleware.handler.after')

class ApiMiddleware {
  constructor (
    reportService,
    dao,
    apiMiddlewareHandlerAfter
  ) {
    this.reportService = reportService
    this.dao = dao

    this._apiMiddlewareHandlerAfter = apiMiddlewareHandlerAfter instanceof ApiMiddlewareHandlerAfter
      ? apiMiddlewareHandlerAfter
      : new ApiMiddlewareHandlerAfter(
        reportService,
        dao
      )
  }

  hasMethod (method) {
    return typeof this.reportService[method] === 'function'
  }

  _hasHandlerAfter (method) {
    return typeof this._apiMiddlewareHandlerAfter[method] === 'function'
  }

  async request (method, args, isCheckCall = false) {
    const apiRes = await this._requestToReportService(method, args)
    const res = await this._after(method, args, apiRes, isCheckCall)

    return res
  }

  _requestToReportService (method, args) {
    if (!this.hasMethod(method)) {
      throw new Error('ERR_METHOD_NOT_FOUND')
    }

    const fn = this.reportService[method].bind(this.reportService)

    return fn(args)
  }

  _after (method, args, apiRes, isCheckCall) {
    if (!this._hasHandlerAfter(method)) {
      return apiRes
    }

    const fn = this._apiMiddlewareHandlerAfter[method].bind(
      this._apiMiddlewareHandlerAfter
    )

    return fn(args, apiRes, isCheckCall)
  }
}

module.exports = ApiMiddleware
