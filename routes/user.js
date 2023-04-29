const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const userControl = require('../controllers/user')



router.get('/user', auth.http,  userControl.getCurrentUserInfo)
router.get('/friends/', auth.http, userControl.getFriendsStatuses)
router.get('/logout', userControl.logOut)
router.post('/signup', userControl.signUp)
router.post('/login', userControl.logIn)
router.post('/sendRequest/:id', auth.http, userControl.requestFriend)



// Check for OPTIONS request made by CORS Preflight so we can validate it
router.options('/', userControl.validatePreflight)


module.exports = router