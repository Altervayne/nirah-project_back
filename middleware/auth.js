const jwtoken = require('jsonwebtoken')



module.exports = (request, response, next) => {
    try {
        const token = resquest.headers.authorization.split(' ')[1]
        const decodedToken = jwtoken.verify(token, '123456789')
        const userId = decodedToken.userId

        request.auth = {
            userId: userId
        }

        next()
    }

    catch(error) {
        response.status(401).json({ error })
    }
}