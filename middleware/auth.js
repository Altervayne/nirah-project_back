const jwtoken = require('jsonwebtoken')

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

module.exports = (request, response, next) => {
    try {
        const token = request.cookies.token
        console.log(token)

        const decodedToken = jwtoken.verify(token, process.env.TOKENKEY, { algorithms: ['HS256'] })
        console.log(decodedToken)

        const userId = decodedToken.userId
        request.auth = {
            userId: userId,
        }

        next()
    } catch (error) {
        response.status(401).json({ error: 'Authentication failed!' })
    }
}