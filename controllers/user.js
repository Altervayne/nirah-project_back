const User = require('../models/user')
const jwtoken = require('jsonwebtoken')
const bcrypt = require('bcrypt')



exports.getCurrentUserInfo = (request, response, next) => {
    const userId = request.auth.userId

    User.findOne({ _id: userId })
        .then((currentUser) => {
            const currentUserInfo = {
                username: currentUser.username,
                friendsList: currentUser.friendsList,
                requestsSent: currentUser.requestsSent,
                requestsReceived: currentUser.requestsReceived
            }
            response.status(201).json({ currentUserInfo })
        })
        .catch((error) => {response.status(400).json({ error })})
}



exports.getFriendsStatus = (request, response, next) => {
    const userId = request.auth.userId

    User.findOne({ _id: userId })
        .then((currentUser) => {
            const friendsList = currentUser.friendsList
            const friendsStatusesArray = []

            for(friendId in friendsList) {
                User.findOne({ _id: friendId })
                    .then((friend) => {
                        const friendStatus = {
                            username: friend.username,
                            isOnline: friend.isOnline,
                            currentRoom: friend.currentRoom
                        }

                        friendsStatusesArray.push(friendStatus)
                    })
            }
        })
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
                isOnline: false,
                currentRoom: null
            })
            user.save()
                .then(() => response.status(201).json({ message: 'Utilisateur créé !' }))
                .catch((error) => response.status(400).json({ error }))
        })
        .catch((error) => response.status(500).json({ error }))
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


                    response.status(200).json({
                        userId: user._id,
                        token: jwtoken.sign(
                            { userId: user._id },
                            '123456789',
                            { expiresIn: '24h' }
                        )
                    })
                })
                .catch((error) => response.status(500).json({ error }))
        })
}


exports.requestFriend = (request, response, next) => {
    const userId = request.auth.userId

    User.findOne({ username: request.params.id })
        .then((targetUser) => {
            const requestedUser = targetUser

            // We make sure to prevent any rogue requests by checking if the requesting
            // user isn't already in the requested user's lists
            if (userId in requestedUser.requestsReceived) {
                return response.status(400).json({ message: "Vous avez déjà envoyé une demande d'ajout à cet utilisateur." })
            }
            if (userId in requestedUser.requestsSent) {
                return response.status(400).json({ message: "Cet utilisateur vous a déjà envoyé une demande d'ajout." })
            }
            if (userId in requestedUser.friendsList) {
                return response.status(400).json({ message: "Cet utilisateur est déjà votre ami." })
            }

            // If the coast is clear, we add the user to the requested User's requests
            // received array and add the requested User to the current User's requests
            // sent array
            else {
                requestedUser.requestsReceived.push(userId)

                User.findOne({ _id: userId })
                    .then((currentUser) => {
                        currentUser.requestsSent.push(requestedUser._id)
                        currentUser.save()
                    })
            }

            // We then save to MongoDB
            requestedUser.save()
                .then(
                    response.status(200).json({ message: "Demande d'ajout envoyée avec succès !"})
                )
        })
}