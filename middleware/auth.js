const User = require('../models/user')
const jwtoken = require('jsonwebtoken')

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}



exports.http = async (request, response, next) => {
    try {
        const token = request.cookies.token
        const decodedToken = jwtoken.verify(token, process.env.TOKENKEY, { algorithms: ['HS256'] })
        const userId = decodedToken.userId

        const authenticadedUser = await User.findOne({ _id: userId })
        const username = authenticadedUser.username


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



exports.sockets = async (socket, next, data) => {
    try {
        if (!socket.request.cookies.token) {
            throw new Error('Authentication token not found, access denied.')
        }

        const token = socket.request.cookies.token
        const decodedToken = jwtoken.verify(token, process.env.TOKENKEY, { algorithms: ['HS256'] })
        const userId = decodedToken.userId

        const authenticatedUser = await User.findOne({ _id: userId })
        if (!authenticatedUser) {
            throw new Error('User not found, access denied.')
        }

        const username = authenticatedUser.username

        socket.auth = {
            userId: userId,
            username: username
        }

        console.log(socket.auth)

        next()
    } catch (error) {
        next(new Error('Authentication failed.'))
    }
}