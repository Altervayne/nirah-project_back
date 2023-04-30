if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}



exports.joinRoom = async (socket, users, io) => {
    const userId = socket.userId
    const username = socket.username
    const { room } = socket.handshake.query
    const roomDocument = await Room.findOne({ name: room });


    const roomExists = io.sockets.adapter.rooms[room];
    if (!roomExists) {
        io.sockets.adapter.rooms[room] = {
            sockets: {},
            length: 0,
        }
    }


    socket.join(room)
    users[socket.id] = { userId, username, room }
    socket.to(room).broadcast.emit('userJoined', username)

        
    if (!roomDocument) {
        const newRoom = new Room({
            name: room,
            members: [{ userId: userId, username: username }],
            messages: [],
        })
        await newRoom.save()

    } else {
        if (!roomDocument.members.some(member => member.userId === userId)) {
            roomDocument.members.push({ userId: userId, username: username })
            await roomDocument.save()
        }
    }
}



exports.sendMessage = (socket, users, io) => async (message) => {
    const { userId, username, room } = users[socket.id]
    const roomDocument = await Room.findOne({ name: room })

    const newMessage = {
        body: message,
        sender: {
            userId: userId,
            username: username
        },
        createdAt: new Date(),
    }
            
    io.to(room).emit("message", newMessage)


    if (roomDocument) {
        roomDocument.messages.push(newMessage)
        await roomDocument.save()
    }
      
}



exports.disconnect = async (socket, users, io) => {
    const { userId, username, room } = users[socket.id]
    const roomDocument = await Room.findOne({ name: room })

    socket.to(room).broadcast.emit('userLeft', username)
    delete users[socket.id]

    if (roomDocument) {
        roomDocument.members = roomDocument.members.filter(member => member.userId !== userId)
        await roomDocument.save()

        if (roomDocument.members.length === 0) {
            await Room.deleteOne({ _id: roomDocument._id })
        }
    }

    const roomExists = io.sockets.adapter.rooms[room];
    if (roomExists && roomExists.length === 0) {
        delete io.sockets.adapter.rooms[room]
    }
}