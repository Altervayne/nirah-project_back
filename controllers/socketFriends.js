const User = require('../models/user')


if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}



exports.friendRequest = async (socket, io, userIdToSocketIdMap, data) => {
    const userId = socket.auth.userId
    const username = socket.auth.username
    const targetUser = data.userId
    const requestType = data.requestType

    console.log("---------------------------------------------")
    console.log("userIdToSocketIdMap Map is:")
    console.log(userIdToSocketIdMap)
    console.log("---------------------------------------------")

    const validTypes = ["send", "accept", "reject"]

    if (validTypes.includes(requestType)) {
        
        const targetUserSocket = userIdToSocketIdMap.get(targetUser)

        console.log("Attempting to emit request to target socket:")
        console.log(targetUserSocket)


        // If the requested user is connected, emit the "sendRequest" event exclusively to them using the to() method
        if (targetUserSocket) {
            io.to(targetUserSocket).emit(`${requestType}Request`, { userId: userId, username: username })

            return
        }

        console.log("Failed, targetUserSocket is a falsy value")
    } else {
        console.log("Request type is invalid. Request type must be 'send', 'accept' or 'reject'")
        io.to(socket).emit("error", { message: "Request type is invalid. Request type must be 'send', 'accept' or 'reject'" })

        return
    }  
}

exports.friendConnectionUpdate = async (socket, io, userIdToSocketIdMap, connectionState) => {
    const userId = socket.auth.userId
    const username = socket.auth.username

    const currentUserDocument = await User.findOne({ _id: userId })

    const currentUserFriendIds = currentUserDocument.friendsList.map(friend => friend.userId)
    const friendSocketIds = currentUserFriendIds.map(userId => userIdToSocketIdMap.get(userId))

    friendSocketIds.forEach(socketId => {
        io.to(socketId).emit(connectionState, { userId: userId, username: username });
    })
}