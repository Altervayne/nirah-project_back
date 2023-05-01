const Room = require('../models/room')


if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}



exports.joinRoom = async (socket, io, users, data) => {
    const userId = socket.auth.userId
    const username = socket.auth.username
    const room = data.roomId
    const roomDocument = await Room.findOne({ name: room });

    if (!io || !io.sockets || !io.sockets.adapter) {
        console.error("Error: io is not defined or initialized correctly")
        return
    }


    const roomExists = io.sockets.adapter.rooms[room];
    if (!roomExists) {
        io.sockets.adapter.rooms[room] = {
            sockets: {},
            length: 0,
        }
    }


    socket.join(room)
    users[socket.id] = { userId, username, room }
    io.to(room).emit('userJoined', username)

        
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

    console.log(`User ${username} has joined room ${room}.`)
}



exports.sendMessage = async (socket, io, users, data) => {
    if (!users[socket.id]) {
        console.log(`User with socket id ${socket.id} is not in any room.`)
        return
    }
    

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



exports.leaveRoom = async (socket, io, users, data) => {
    if (!users[socket.id]) {
        console.log(`User with socket id ${socket.id} is not in any room.`)
        return
    }


    const { userId, username, room } = users[socket.id]
    const roomDocument = await Room.findOne({ name: room })

    io.to(room).emit('userJoined', username)
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

    console.log(`User ${username} has left room ${room}.`)
}