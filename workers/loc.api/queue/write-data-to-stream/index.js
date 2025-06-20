'use strict'

const { cloneDeep, omit } = require('lib-js-util-base')

const {
  writeMessageToStream,
  setDefaultParams,
  filterMovementsByAmount,
  write,
  progress
} = require('./helpers')

module.exports = (
  rService,
  processorQueue,
  getDataFromApi
) => async (
  stream,
  jobData
) => {
  if (typeof jobData === 'string') {
    writeMessageToStream(processorQueue, stream, jobData)

    return
  }

  const method = jobData.name

  if (typeof rService[method] !== 'function') {
    throw new Error('ERR_METHOD_NOT_FOUND')
  }

  const propName = jobData.propNameForPagination
  const formatSettings = jobData.formatSettings

  const _args = {
    auth: { ...jobData?.args?.auth },
    params: omit(jobData?.args?.params ?? {}, [
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

  setDefaultParams(_args, method)
  const currIterationArgs = cloneDeep(_args)

  const getData = rService[method].bind(rService)

  let count = 0
  let serialRequestsCount = 0

  while (true) {
    processorQueue.emit('progress', 0)

    const _res = await getDataFromApi({
      getData,
      args: currIterationArgs,
      callerName: 'REPORT_FILE_WRITER',
      shouldNotInterrupt: true
    })

    const isGetWalletsMethod = method === 'getWallets'
    const isGetActivePositionsMethod = (
      method === 'getActivePositions'
    )
    const { res: apiRes, nextPage } = (
      isGetWalletsMethod ||
      isGetActivePositionsMethod ||
      Object.keys({ ..._res }).every(key => key !== 'nextPage')
    )
      ? { res: _res, nextPage: null }
      : _res
    let res = method === 'getMovements'
      ? filterMovementsByAmount(apiRes, _args)
      : apiRes

    currIterationArgs.params.end = nextPage

    if (
      res &&
      Array.isArray(res) &&
      res.length === 0 &&
      nextPage &&
      Number.isInteger(nextPage) &&
      serialRequestsCount < 1000
    ) {
      serialRequestsCount += 1

      continue
    }

    serialRequestsCount = 0

    if (
      res &&
      typeof res === 'object' &&
      !Array.isArray(res) &&
      Object.keys(res).length > 0
    ) {
      write(
        res,
        stream,
        formatSettings,
        { ..._args.params },
        method
      )
      processorQueue.emit('progress', 100)

      break
    }
    if (
      !res ||
      !Array.isArray(res) ||
      res.length === 0
    ) {
      if (count > 0) processorQueue.emit('progress', 100)

      break
    }

    const lastItem = res[res.length - 1]

    if (
      !lastItem ||
      typeof lastItem !== 'object'
    ) break

    const currTime = lastItem[propName]
    let isAllData = isGetWalletsMethod

    if (
      !isGetWalletsMethod &&
      !isGetActivePositionsMethod &&
      Number.isInteger(currTime) &&
      _args.params.start >= currTime
    ) {
      res = res.filter((item) => _args.params.start <= item[propName])
      isAllData = true
    }

    write(
      res,
      stream,
      formatSettings,
      { ..._args.params },
      method
    )

    count += res.length

    if (
      isAllData ||
      !Number.isInteger(currTime) ||
      !Number.isInteger(nextPage)
    ) {
      processorQueue.emit('progress', 100)

      break
    }

    progress(processorQueue, currTime, _args.params)

    if (!Number.isInteger(currIterationArgs.params.end)) {
      currIterationArgs.params.end = lastItem[propName] - 1
    }
  }
}
