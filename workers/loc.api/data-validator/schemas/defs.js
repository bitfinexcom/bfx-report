'use strict'

const SCHEMA_IDS = require('../schema.ids')

module.exports = {
  $id: SCHEMA_IDS.DEFS,
  definitions: {
    dateFormat: {
      type: 'string',
      enum: [
        'DD-MM-YY',
        'DD-MM-YYYY',
        'MM-DD-YY',
        'MM-DD-YYYY',
        'YY-MM-DD',
        'YYYY-MM-DD'
      ]
    },
    language: {
      type: 'string',
      minLength: 2
    }
  }
}
