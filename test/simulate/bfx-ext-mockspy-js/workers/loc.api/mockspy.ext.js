'use strict'

const createApi = require('../../../stub-spies-helpers/api')
const argv = require('yargs').argv

const name = argv.mockspy
const { addFunctions } = require(`../../../mocks-spies/${name}`)

const ExtApiComplete = createApi(addFunctions)

module.exports = ExtApiComplete
