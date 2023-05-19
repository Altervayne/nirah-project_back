const User = require('../models/user')
const jwtoken = require('jsonwebtoken')
const bcrypt = require('bcrypt')

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}



exports.getCurrentUserInfo = (request, response, next) => {
    const userId = request.auth.userId

    User.findOne({ _id: userId })
        .then((currentUser) => {
            const currentUserInfo = {
                username: currentUser.username,
                friendsList: currentUser.friendsList,
                requestsReceived: currentUser.requestsReceived,
                requestsSent: currentUser.requestsSent,
                currentRoom: currentUser.currentRoom
            }
            response.status(201).json( currentUserInfo )
        })
        .catch((error) => {response.status(400).json({ error })})
}



exports.logOut = async (request, response) => {
    const userId = request.auth.userId

    try {
        const currentUser = await User.findOne({ _id: userId })

        currentUser.isOnline = false
        await currentUser.save()

    } catch (error) {
        response.status(400).json({ error })
    }

    try {
        response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        response.clearCookie('token')
        response.status(200).json({ message: 'User logged out' })
    } catch {
        console.log(error)
        response.status(400).json({ error })
    }
}



exports.signUp = (request, response, next) => {
    const lowerCaseEmail = request.body.email.toLowerCase()

    bcrypt.hash(request.body.password, 10)
        .then(hash => {
            const user = new User({
                email: lowerCaseEmail,
                username: request.body.username,
                password: hash,
                friendsList: [],
                requestsReceived: [],
                requestsSent: [],
                isOnline: true,
                currentRoom: 0,
            })
            user.save()
                .then(() => {
                    User.findOne({ email: lowerCaseEmail })
                    .then((user) => {
                        const token = jwtoken.sign(
                            { userId: user._id },
                            process.env.TOKENKEY,
                            { expiresIn: '24h', algorithm: 'HS256' })
    
                        
                        response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
                        response.cookie('token', token, { httpOnly: true, sameSite: 'strict' })
                        response.status(200).json({ message: "User succesfully created and logged in!" })
                    })
                    .catch((error) => response.status(500).json({ error }))
                })
                .catch((error) => response.status(400).json({ error, request }))
        })
}



exports.logIn = (request, response, next) => {
    const lowerCaseEmail = request.body.email.toLowerCase()

    User.findOne({ email: lowerCaseEmail })
        .then((user) => {
            if (!user) {
                return response.status(401).json({ message: 'Adresse mail ou mot de passe incorrect.' })
            } 

            bcrypt.compare(request.body.password, user.password)
                .then((passwordValid) => {
                    if (!passwordValid) {
                        return response.status(401).json({ message: 'Adresse mail ou mot de passe incorrect.' })
                    }

                    const token = jwtoken.sign(
                        { userId: user._id },
                        process.env.TOKENKEY,
                        { expiresIn: '24h', algorithm: 'HS256' })

                    user.isOnline = true
                    user.save()


                    response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
                    response.cookie('token', token, { httpOnly: true, sameSite: 'strict' })
                    response.status(200).json({ message: "User succesfully logged in!" })
                })
                .catch((error) => response.status(500).json({ error }))
        })
}



exports.delete = async (request, response, next) => {
    const userId = request.auth.userId
    const sentPassword = request.body.password



    const userDocument = await User.findOne({ _id: userId })

    if (!userDocument) {
        response.status(400).json({ message: 'User not found' })
    } else {
        await bcrypt.compare(sentPassword, userDocument.password)
                    .then((passwordValid) => {
                        if (!passwordValid) {
                            return response.status(401).json({ message: 'Mot de passe incorrect.' })
                        } else {
                            userDocument.deleteOne()
                        }
                    })
                    .catch((error) => response.status(500).json({ message: 'Erreur serveur' }))
    }

    try {
        response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        response.clearCookie('token')
        response.status(200).json({ message: 'User has deleted their account' })
    } catch {
        console.log(error)
        response.status(400).json({ message: 'Erreur lors de la suppression' })
    }  
}



exports.validatePreflight = (request, response, next) => {
    response.status(200).json({
        message: 'Preflight request validated'
    })
}