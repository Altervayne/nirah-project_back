const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const friendControl = require('../controllers/friend')



router.post('/sendRequest/:id', auth.http, friendControl.sendRequest)
router.post('/acceptRequest/:id', auth.http, friendControl.acceptRequest)
router.post('/rejectRequest/:id', auth.http, friendControl.rejectRequest)



// Check for OPTIONS request made by CORS Preflight so we can validate it
router.options('/', userControl.validatePreflight)



module.exports = router