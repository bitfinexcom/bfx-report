'use strict'

const createWorker = require('../../stub-spies-helpers/worker')
const argv = require('yargs').argv

const name = argv.mockspy
const { workerArgs } = require(`../../mocks-spies/${name}`)

const WrkExtMockspyApi = createWorker(...workerArgs)

module.exports = WrkExtMockspyApi
