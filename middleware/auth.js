const User = require('../models/user')
const jwtoken = require('jsonwebtoken')

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

module.exports = (request, response, next) => {
    try {
        const token = request.cookies.token
        const decodedToken = jwtoken.verify(token, process.env.TOKENKEY, { algorithms: ['HS256'] })
        const userId = decodedToken.userId
        let username = ''

        User.findOne({ _id: userId })
            .then((authenticatedUser) => {
                username = authenticatedUser.username
            })

        request.auth = {
            userId: userId,
            username: username
        }

        console.log(request.auth)

        next()
    } catch (error) {
        response.status(401).json({ error: 'Authentication failed!' })
    }
}