'use strict'

const cors = require('cors')

const corsBase = () => {
  const corsOptions = {
    origin: true,
    methods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200
  }

  return cors(corsOptions)
}

module.exports = {
  corsBase
}
