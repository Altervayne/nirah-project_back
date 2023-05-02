const Room = require('../models/room')

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
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