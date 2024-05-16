'use strict'

const {
  write
} = require('../../queue/write-data-to-stream/helpers')

const { streamWriter } = require('./helpers')

module.exports = (
  rService,
  getDataFromApi
) => async (
  wStream,
  jobData
) => {
  const queue = rService.ctx.lokue_aggregator.q
  const {
    args,
    columnsCsv,
    formatSettings,
    name
  } = jobData ?? {}
  const { params } = args ?? {}

  queue.emit('progress', 0)

  if (typeof jobData === 'string') {
    await streamWriter(
      wStream,
      [{
        columnParams: { columns: ['mess'] },
        writeFn: (stream) => write([{ mess: jobData }], stream)
      }]
    )

    queue.emit('progress', 100)

    return
  }

  const { res } = await getDataFromApi({
    getData: rService[name].bind(rService),
    args,
    callerName: 'CSV_WRITER',
    shouldNotInterrupt: true
  })

  wStream.setMaxListeners(50)

  await streamWriter(
    wStream,
    [
      {
        columnParams: {
          columns: ['empty', 'buy', 'empty', 'empty', 'sell', 'empty', 'empty', 'cumulative', 'empty']
        },
        writeFn: (stream) => write(
          [{ empty: '', buy: 'Buy', sell: 'Sell', cumulative: 'Cumulative' }],
          stream
        )
      },
      {
        columnParams: {
          header: true,
          columns: columnsCsv
        },
        writeFn: (stream) => write(
          res,
          stream,
          formatSettings,
          params
        )
      }
    ]
  )

  queue.emit('progress', 100)
}
