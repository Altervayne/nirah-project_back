const User = require('../models/user')
const Room = require('../models/room')

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}



exports.leaveRoom = async (request, response, next) => {
    const userId = request.auth.userId

    try {
        /* We get the user's documents */
        const currentUserDocument = await User.findOne({ _id: userId })

        /* We update the user's document to indicate they are no longer in a room */
        const previousRoom = currentUserDocument.currentRoom
        currentUserDocument.currentRoom = 0
        await currentUserDocument.save()


        response.status(200).json({ message: `User has left room ${previousRoom}` })
    }
    catch {
        response.status(500).json({ message: `Server error` })
    }
}



exports.getCurrentRoomInfo = async (request, response, next) => {
    const roomName = request.params.id

    console.log(`Requested room is: Room ${roomName}`)

    const currentRoom = await Room.findOne({ name: roomName })
    
    if(!currentRoom) {
        console.log("Room doesn't exist, creating.")

        const currentRoomInfo = {
            members: [],
            messages: []
        }

        response.status(201).json( currentRoomInfo )
    } else {
        console.log("Room exists, sending data.")

        const currentRoomInfo = {
            members: currentRoom.members,
            messages: currentRoom.messages
        }

        response.status(201).json( currentRoomInfo )
    }
}



exports.validatePreflight = (request, response, next) => {
    response.status(200).json({
        message: 'Preflight request validated'
    })
}