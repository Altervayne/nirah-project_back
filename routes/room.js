const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const roomControl = require('../controllers/room')



router.get('/room/:name', auth.http,  roomControl.getCurrentRoomInfo)



// Check for OPTIONS request made by CORS Preflight so we can validate it
router.options('/', roomControl.validatePreflight)


module.exports = router