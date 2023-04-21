const express = require('express')
const router = express.Router()

const userControl = require('../controllers/user')



router.post('/signup', userControl.signUp)
router.post('/login', userControl.logIn)



module.exports = router