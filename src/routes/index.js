'use strict'

const express = require('express')

const router = express.Router()
module.exports = router

const { logService, helpers } = require('../services')
const controllers = require('../controllers')

const { logger } = logService
const { responses } = helpers

const { baseController } = controllers

router.post('/checkAuth', baseController.checkAuth)
router.get('/ledgers', baseController.getLedgers)
