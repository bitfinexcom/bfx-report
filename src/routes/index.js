'use strict'

const express = require('express')

const router = express.Router()
module.exports = router

const controllers = require('../controllers')

const { baseController } = controllers

router.post('/checkAuth', baseController.checkAuth)
router.get('/ledgers', baseController.getLedgers)
