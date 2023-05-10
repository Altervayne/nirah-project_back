const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const friendControl = require('../controllers/friend')



router.get('/', auth.http, friendControl.getAllFriends)
router.get('/:id', auth.http, friendControl.getOneFriend)
router.post('/sendRequest/:id', auth.http, friendControl.sendRequest)
router.post('/acceptRequest/:id', auth.http, friendControl.acceptRequest)
router.post('/rejectRequest/:id', auth.http, friendControl.rejectRequest)
router.post('/remove/:id', auth.http, friendControl.removeFriend)



// Check for OPTIONS request made by CORS Preflight so we can validate it
router.options('/', friendControl.validatePreflight)



module.exports = router