'use strict'

const { Router } = require('express')

const router = new Router()
module.exports = router

const { asyncErrorCatcher } = require('../services/helpers')
const controllers = require('../controllers')
const baseController = asyncErrorCatcher(controllers.baseController)

router.post('/check-auth', baseController.checkAuth)
router.post('/check-stored-locally', baseController.checkStoredLocally)
router.post('/get-data', baseController.getData)
