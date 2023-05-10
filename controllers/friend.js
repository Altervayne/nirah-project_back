const User = require('../models/user')

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}



exports.sendRequest = (request, response, next) => {
    const currentUser = { userId: request.auth.userId, username: request.auth.username }
    

    User.findOne({ _id: request.params.id })
        .then((targetUser) => {
            const requestedUserDocument = targetUser
            const requestedUser = { userId: request.params.id, username: requestedUserDocument.username }

            const hasReceived = requestedUserDocument.requestsReceived.some(user => user.userId === currentUser.userId)
            const hasSent = requestedUserDocument.requestsSent.some(user => user.userId === currentUser.userId)
            const isFriend = requestedUserDocument.friendsList.some(friend => friend.userId === currentUser.userId)

            console.log("---------------------------------------")
            console.log("requestedUser object is:")
            console.log(requestedUser)
            console.log("---------------------------------------")

            // We make sure to prevent any rogue requests by checking if the requesting
            // user isn't already in the requested user's lists
            if (hasReceived) {
                return response.status(400).json({ message: "Vous avez déjà envoyé une demande d'ajout à cet utilisateur." })
            } else
            if (hasSent) {
                return response.status(400).json({ message: "Cet utilisateur vous a déjà envoyé une demande d'ajout." })
            } else
            if (isFriend) {
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



exports.acceptRequest = (request, response, next) => {
    const currentUser = { userId: request.auth.userId, username: request.auth.username }
    

    User.findOne({ _id: request.params.id })
        .then((targetUser) => {
            const acceptedUserDocument = targetUser
            const acceptedUser = { userId: request.params.id, username: acceptedUserDocument.username }

            const isFriend = acceptedUserDocument.friendsList.some(friend => friend.userId === currentUser.userId)
            const hasReceived = acceptedUserDocument.requestsReceived.some(user => user.userId === currentUser.userId)

            console.log("---------------------------------------")
            console.log("acceptedUser object is:")
            console.log(acceptedUser)
            console.log("---------------------------------------")

            // We make sure to prevent any rogue requests by checking if the requesting
            // user isn't already in the requested user's relevant lists
            if (hasReceived) {
                return response.status(400).json({ message: "Vous avez déjà envoyé une demande d'ajout à cet utilisateur." })
            }
            if (isFriend) {
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



exports.rejectRequest = (request, response, next) => {
    const currentUser = { userId: request.auth.userId, username: request.auth.username }
    

    User.findOne({ _id: request.params.id })
        .then((targetUser) => {
            const rejectedUserDocument = targetUser
            const rejectedUser = { userId: request.params.id, username: rejectedUserDocument.username }

            const hasReceived = rejectedUserDocument.requestsReceived.some(user => user.userId === currentUser.userId)
            const isFriend = rejectedUserDocument.friendsList.some(friend => friend.userId === currentUser.userId)

            console.log("---------------------------------------")
            console.log("rejectedUser object is:")
            console.log(rejectedUser)
            console.log("---------------------------------------")

            // We make sure to prevent any rogue requests by checking if the requesting
            // user isn't already in the rejected user's lists
            if (hasReceived) {
                return response.status(400).json({ message: "Vous avez déjà envoyé une demande d'ajout à cet utilisateur." })
            }
            if (isFriend) {
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



exports.removeFriend = (request, response, next) => {
    const currentUser = { userId: request.auth.userId, username: request.auth.username }

    User.findOne({ _id: request.params.id })
    .then((targetUser) => {
        const removedUserDocument = targetUser
        const removedUser = { userId: request.params.id, username: removedUserDocument.username }

        const isFriend = removedUserDocument.friendsList.some(friend => friend.userId === currentUser.userId)

        console.log("---------------------------------------")
        console.log("removedUser object is:")
        console.log(removedUser)
        console.log("---------------------------------------")

        // We make sure to prevent any rogue requests by checking if the removing user is really friends with the removed user
        if (!isFriend) {
            return response.status(400).json({ message: "Vous n'êtes pas ami avec cet utilisateur." })
        }

        // If they are, we remove them from the removed user's friends list
        else {
            const newFriendsList = removedUserDocument.friendsList.filter(user => user.userId !== currentUser.userId)
            removedUserDocument.friendsList = newFriendsList

            User.findOne({ _id: currentUser.userId })
                .then((user) => {
                    const currentUserDocument = user
                    const newFriendsList = currentUserDocument.friendsList.filter(user => user.userId !== removedUser.userId)

                    currentUserDocument.friendsList = newFriendsList
                    currentUserDocument.save()
                })
                .catch((error) => {
                    console.log(error)
                    response.status(400).json({ error })
                })
        }

        // We then save to MongoDB
        removedUserDocument.save()
            .then(
                response.status(200).json({ message: "Ami supprimé avec succés !"})
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



exports.getAllFriends = async (request, response, next) => {
    const userId = request.auth.userId

    try {
        const currentUser = await User.findOne({ _id: userId })
        const friendIds = currentUser.friendsList.map(friend => friend.userId)
        const friendsArray = await User.find({ _id: { $in: friendIds }})
                                            .select('_id username isOnline currentRoom')

        const friendsStatuses = friendsArray.map(friend => {
            const { _id, ...rest } = friend
            return { userId: _id, ...rest }
        })

        response.status(200).json( friendsStatuses )
    } catch (error) {
        response.status(400).json({ error })
    }
}



exports.getOneFriend = async (request, response, next) => {
    const userId = request.auth.userId

    User.findOne({ _id: request.params.id })
        .then((targetFriend) => {
            const friendData = {
                userId: targetFriend._id,
                username: targetFriend.username,
                isOnline: targetFriend.isOnline,
                currentRoom: targetFriend.currentRoom
            }

            response.status(200).json( friendData )
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