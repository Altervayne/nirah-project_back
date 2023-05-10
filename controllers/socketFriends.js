const User = require('../models/user')


if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}



exports.mapFriendIds = async (friendsList, userIdToSocketIdMap) => {
    /* We get the current user's friend Ids from their friendsList */
    const currentUserFriendIds = friendsList.map(friend => friend.userId)

    /* And map each of those Ids to matching currently connected socket users */
    const friendSocketIds = currentUserFriendIds.map(userId => userIdToSocketIdMap.get(userId))

    /* We return the friends socket Ids */
    return friendSocketIds
}



exports.friendRequest = async (socket, io, userIdToSocketIdMap, data) => {
    /* We initialize the necessary constants using the event's data and the current user's auth token */
    const userId = socket.auth.userId
    const username = socket.auth.username
    const targetUser = data.userId
    const requestType = data.requestType

    /* We initialize an array containing the currently accepted types of requests */
    const validTypes = ["sendRequest", "acceptRequest", "rejectRequest", "remove"]



    /* We check if the request is of a valid type */
    if (validTypes.includes(requestType)) {
        
        /* We get the target user's socket using the userId to socketId map */
        const targetUserSocket = userIdToSocketIdMap.get(targetUser)

        // If the requested user is connected, we emit the "sendRequest" event exclusively to them
        if (targetUserSocket) {
            io.to(targetUserSocket).emit(`${requestType}`, { userId: userId, username: username })
            return
        }
    }
    
    /* If the request is of an invalid type, we notify the client and log the error in the console. */
    else {
        console.error("Request type is invalid. Request type must be 'send', 'accept' or 'reject'")
        io.to(socket).emit("error", { message: "Request type is invalid. Request type must be 'send', 'accept' or 'reject'" })

        return
    }  
}



exports.friendConnectionUpdate = async (socket, io, userIdToSocketIdMap, connectionState) => {
    /* We initialize the necessary constants using the user's auth token */
    const userId = socket.auth.userId
    const username = socket.auth.username

    /* We get the required user document and map the friends' userIds to their socketIds*/
    const currentUserDocument = await User.findOne({ _id: userId })
    const friendSocketIds = await this.mapFriendIds(currentUserDocument.friendsList, userIdToSocketIdMap)

    /* We notify each friend of the current user's connection state */
    friendSocketIds.forEach(socketId => {
        io.to(socketId).emit(connectionState, { userId: userId, username: username });
    })
}