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
                requestsSent: currentUser.requestsSent
            }
            response.status(201).json( currentUserInfo )
        })
        .catch((error) => {response.status(400).json({ error })})
}



exports.getFriendsStatuses = async (request, response, next) => {
    const userId = request.auth.userId

    try {
        const currentUser = await User.findOne({ _id: userId }).populate('friendsList', 'username isOnline currentRoom')
        const friendsStatusesArray = currentUser.friendsList.map((friend) => {
            return {
                username: friend.username,
                isOnline: friend.isOnline,
                currentRoom: friend.currentRoom
            }
        })

        response.status(200).json({ friendsStatusesArray })
    } catch (error) {
        response.status(400).json({ error })
    }
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
    bcrypt.hash(request.body.password, 10)
        .then(hash => {
            const user = new User({
                email: request.body.email,
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
                    User.findOne({ email: request.body.email })
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
    User.findOne({ email: request.body.email })
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



exports.requestFriend = (request, response, next) => {
    const currentUser = { userId: request.auth.userId, username: request.auth.username }
    

    User.findOne({ _id: request.params.id })
        .then((targetUser) => {
            const requestedUserDocument = targetUser
            const requestedUser = { userId: request.params.id, username: requestedUserDocument.username }

            console.log("---------------------------------------")
            console.log("requestedUser object is:")
            console.log(requestedUser)
            console.log("---------------------------------------")

            // We make sure to prevent any rogue requests by checking if the requesting
            // user isn't already in the requested user's lists
            if (currentUser.userId in requestedUserDocument.requestsReceived) {
                return response.status(400).json({ message: "Vous avez déjà envoyé une demande d'ajout à cet utilisateur." })
            }
            if (currentUser.userId in requestedUserDocument.requestsSent) {
                return response.status(400).json({ message: "Cet utilisateur vous a déjà envoyé une demande d'ajout." })
            }
            if (currentUser.userId in requestedUserDocument.friendsList) {
                return response.status(400).json({ message: "Cet utilisateur est déjà votre ami." })
            }

            // If the coast is clear, we add the user to the requested User's requests
            // received array and add the requested User to the current User's requests
            // sent array
            else {
                requestedUserDocument.requestsReceived.push(currentUser)

                User.findOne({ _id: currentUser.userId })
                    .then((user) => {
                        const requestingUserDocument = user

                        requestingUserDocument.requestsSent.push(requestedUser)
                        requestingUserDocument.save()
                    })
                    .catch((error) => {
                        console.log(error)
                        response.status(400).json({ error })
                    })
            }

            // We then save to MongoDB
            requestedUserDocument.save()
                .then(
                    response.status(200).json({ message: "Demande d'ajout envoyée avec succès !"})
                )
                .catch((error) => {
                    console.log(error)
                    response.status(400).json({ error })
                })
        })
        .catch((error) => {
            console.log(error)
            response.status(400).json({ error })
        })
}



exports.acceptFriend = (request, response, next) => {
    const currentUser = { userId: request.auth.userId, username: request.auth.username }
    

    User.findOne({ _id: request.params.id })
        .then((targetUser) => {
            const acceptedUserDocument = targetUser
            const acceptedUser = { userId: request.params.id, username: acceptedUserDocument.username }

            console.log("---------------------------------------")
            console.log("acceptedUser object is:")
            console.log(acceptedUser)
            console.log("---------------------------------------")

            // We make sure to prevent any rogue requests by checking if the requesting
            // user isn't already in the requested user's relevant lists
            if (currentUser.userId in acceptedUserDocument.requestsReceived) {
                return response.status(400).json({ message: "Vous avez déjà envoyé une demande d'ajout à cet utilisateur." })
            }
            if (currentUser.userId in acceptedUserDocument.friendsList) {
                return response.status(400).json({ message: "Cet utilisateur est déjà votre ami." })
            }

            // If the coast is clear, we add the user to the accepted User's friends
            // array and add the accepted User to the current User's friends array
            // and we remove both users from each other's requestsReceived and requestsSent
            // arrays respectively
            else {
                const newRequestsSent = acceptedUserDocument.requestsSent.filter(user => user.userId !== currentUser.userId)
                acceptedUserDocument.friendsList.push(currentUser)
                acceptedUserDocument.requestsSent = newRequestsSent

                User.findOne({ _id: currentUser.userId })
                    .then((user) => {
                        const currentUserDocument = user
                        const newRequestsReceived = currentUserDocument.requestsReceived.filter(user => user.userId !== acceptedUser.userId)

                        currentUserDocument.friendsList.push(acceptedUser)
                        currentUserDocument.requestsReceived = newRequestsReceived

                        currentUserDocument.save()
                    })
                    .catch((error) => {
                        console.log(error)
                        response.status(400).json({ error })
                    })
            }

            // We then save to MongoDB
            acceptedUserDocument.save()
                .then(
                    response.status(200).json({ message: "Demande d'amis acceptés avec succès !"})
                )
                .catch((error) => {
                    console.log(error)
                    response.status(400).json({ error })
                })
        })
        .catch((error) => {
            console.log(error)
            response.status(400).json({ error })
        })
}



exports.rejectFriend = (request, response, next) => {
    const currentUser = { userId: request.auth.userId, username: request.auth.username }
    

    User.findOne({ _id: request.params.id })
        .then((targetUser) => {
            const rejectedUserDocument = targetUser
            const rejectedUser = { userId: request.params.id, username: rejectedUserDocument.username }

            console.log("---------------------------------------")
            console.log("rejectedUser object is:")
            console.log(rejectedUser)
            console.log("---------------------------------------")

            // We make sure to prevent any rogue requests by checking if the requesting
            // user isn't already in the rejected user's lists
            if (currentUser.userId in rejectedUserDocument.requestsReceived) {
                return response.status(400).json({ message: "Vous avez déjà envoyé une demande d'ajout à cet utilisateur." })
            }
            if (currentUser.userId in rejectedUserDocument.friendsList) {
                return response.status(400).json({ message: "Cet utilisateur est déjà votre ami." })
            }

            // If the coast is clear, we add the user to the rejected User's requests
            // received array and add the rejected User to the current User's requests
            // sent array
            else {
                const newRequestsSent = rejectedUserDocument.requestsSent.filter(user => user.userId !== currentUser.userId)
                rejectedUserDocument.requestsSent = newRequestsSent

                User.findOne({ _id: currentUser.userId })
                    .then((user) => {
                        const currentUserDocument = user
                        const newRequestsReceived = currentUserDocument.requestsReceived.filter(user => user.userId !== rejectedUser.userId)

                        currentUserDocument.requestsReceived = newRequestsReceived
                        currentUserDocument.save()
                    })
                    .catch((error) => {
                        console.log(error)
                        response.status(400).json({ error })
                    })
            }

            // We then save to MongoDB
            rejectedUserDocument.save()
                .then(
                    response.status(200).json({ message: "Demande d'amis refusée avec succès !"})
                )
                .catch((error) => {
                    console.log(error)
                    response.status(400).json({ error })
                })
        })
        .catch((error) => {
            console.log(error)
            response.status(400).json({ error })
        })
}



exports.validatePreflight = (request, response, next) => {
    response.status(200).json({
        message: 'Preflight request validated'
    })
}