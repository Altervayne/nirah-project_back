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
                email: currentUser.email,
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



exports.signUp = async (request, response, next) => {
    const lowerCaseEmail = request.body.email.toLowerCase()

    const sameUsernameExists = await User.findOne({ username: request.body.username })
    const sameEmailExists = await User.findOne({ email: request.body.email.toLowerCase() })

    if(sameUsernameExists) {
        response.status(400).json({ message: `Ce nom d'utilisateur est déjà pris.` })

        return
    } else if(sameEmailExists) {
        response.status(400).json({ message: `Cette adresse mail est déjà utilisée.` })

        return
    }

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
                .catch((error) => response.status(500).json({ message: 'Adresse mail ou mot de passe incorrect.' }))
        })
}



exports.delete = async (request, response, next) => {
    const userId = request.auth.userId
    const sentPassword = request.body.password


    /* We go and get the user's document in the DB */
    const userDocument = await User.findOne({ _id: userId })

    /* If the user doesn't exist, we notify the client */
    if (!userDocument) {
        response.status(404).json({ message: 'User not found' })
    }

    /* We check if the password is valid using bcrypt */
    const passwordValid = await bcrypt.compare(sentPassword, userDocument.password)
                                        .then((passwordValid) => {
                                            return passwordValid
                                        })
                                        .catch((error) => response.status(500).json({ message: 'Erreur serveur' }))

    /* If the provided password is invalid, we stop here and there and notify the client */
    if (!passwordValid) {
        response.status(401).json({ message: 'Mot de passe incorrect.' })
    }



    /* We map the Ids of each user in one of our current user's arrays to a corresponding array */
    const friendIds = userDocument.friendsList.map(friend => friend.userId)
    const userRequestsReceivedIds = userDocument.requestsReceived.map(user => user.userId)
    const userRequestsSentIds = userDocument.requestsSent.map(user => user.userId)

    /* We then update in bulk the documents of each users in the current user's lists to take out the current user from their lists */
    await User.updateMany(
        { _id: { $in: friendIds } },
        { $pull: { friendsList: { userId: userId } } }
    )
  
    await User.updateMany(
        { _id: { $in: userRequestsReceivedIds } },
        { $pull: { requestsSent: { userId: userId } } }
    )
  
    await User.updateMany(
        { _id: { $in: userRequestsSentIds } },
        { $pull: { requestsReceived: { userId: userId } } }
    )


    
    /* We try to delete the current user, and catch any errors */
    try {
        await userDocument.deleteOne()

        response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        response.clearCookie('token')
        response.status(202).json({ message: 'User has deleted their account' })
    } catch {
        console.log(error)
        response.status(400).json({ message: 'Erreur lors de la suppression' })
    }  
}



exports.changePassword = async (request, response, next) => {
    const userId = request.auth.userId
    const oldPassword = request.body.oldPassword
    const newPassword = request.body.newPassword


    const userDocument = await User.findOne({ _id: userId })

    bcrypt.compare(oldPassword, userDocument.password)
        .then((passwordValid) => {
            if (!passwordValid) {
                return response.status(401).json({ message: 'Ancien mot de passe incorrect.' })
            }



            bcrypt.hash(newPassword, 10)
                .then(hash => {
                    userDocument.password = hash
                    userDocument.save()

                    response.status(200).json({ message: 'Modification confirmée.' })
                })                   
        })
        .catch((error) => response.status(500).json({ error }))
}



exports.validatePreflight = (request, response, next) => {
    response.status(200).json({
        message: 'Preflight request validated'
    })
}