const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const userControl = require('../controllers/user')



router.get('/user', auth,  userControl.getCurrentUserInfo)
router.get('/friend/:id', auth, userControl.getFriendsStatus)
router.post('/signup', userControl.signUp)
router.post('/login', userControl.logIn)
router.post('/sendRequest/:id', auth, userControl.requestFriend)



module.exports = router