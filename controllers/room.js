const Room = require('../models/room')

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}



exports.getCurrentRoomInfo = (request, response, next) => {
    const roomName = request.params.name

    Room.findOne({ name: roomName })
        .then((currentRoom) => {
            const currentRoomInfo = {
                name: currentRoom.name,
                members: currentRoom.members,
                messages: currentRoom.messages
            }
            response.status(201).json( currentRoomInfo )
        })
        .catch((error) => {response.status(400).json({ error })})
}



exports.validatePreflight = (request, response, next) => {
    response.status(200).json({
        message: 'Preflight request validated'
    })
}