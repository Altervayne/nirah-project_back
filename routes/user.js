const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const userControl = require('../controllers/user')



router.get('/user', auth.http,  userControl.getCurrentUserInfo)
router.get('/logout', auth.http, userControl.logOut)
router.post('/signup', userControl.signUp)
router.post('/login', userControl.logIn)
router.post('/changePassword', userControl.changePassword)
router.delete('/delete', auth.http, userControl.delete)



// Check for OPTIONS request made by CORS Preflight so we can validate it
router.options('/', userControl.validatePreflight)


module.exports = router