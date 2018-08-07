'use strict'

const express = require('express')

const router = express.Router()
module.exports = router

const controllers = require('../controllers')

const { baseController } = controllers

router.post('/check-auth', baseController.checkAuth)
router.post('/check-stored-locally', baseController.checkStoredLocally)
router.post('/get-data', baseController.getData)
