'use strict'

module.exports = (
  rService
) => ({
  service,
  action,
  args = [],
  timeout = 90000
} = {}) => {
  return new Promise((resolve, reject) => {
    rService.ctx.grc_bfx.req(
      service,
      action,
      args,
      { timeout },
      (err, data) => {
        if (err) {
          reject(err)

          return
        }

        resolve(data)
      }
    )
  })
}
