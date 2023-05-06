const { MongoError } = require('mongodb')
const Room = require('../models/room')
const User = require('../models/user')
const locks = require('../helpers/locks')



if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}



function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}



exports.joinRoom = async (socket, io, users, userIdToSocketIdMap, data) => {
    const userId = socket.auth.userId
    const username = socket.auth.username
    const room = `${data.roomId}`

    console.log(`Attempted to join room ${room}`)
    console.log(`User is ${username} with userId ${userId}`)


    while(locks.isLocked(room)) {
        console.log(`Room ${room} is already being created, wait...`)
        await sleep(500)
    }
    


    const currentUserDocument = await User.findOne({ _id: userId })
    const roomDocument = await Room.findOne({ name: room })

    const currentUserFriendIds = currentUserDocument.friendsList.map(friend => friend.userId)
    const friendSocketIds = currentUserFriendIds.map(userId => userIdToSocketIdMap.get(userId))

    

    console.log("Room document is (if null, it didn't exist beforehand):")
    console.log(roomDocument)



    try {
        if (!roomDocument) {
            locks.lockRoomName(room)


            const newRoom = new Room({
                name: room,
                members: [{ userId: userId, username: username }],
                messages: [],
            })
            await newRoom.save()


            locks.unlockRoomName(room)
    
        } else {
            if (!roomDocument.members.some(member => member.userId === userId)) {
                roomDocument.members.push({ userId: userId, username: username })
                await roomDocument.save()
            }
        }
    } catch (error) {
        if (error instanceof MongoError && error.code === 11000) {
            socket.emit("sameRoomName", { message: "Room with same name was being created at the same time, wait for connection..." })
        } else {
            console.error(error)
        }
    }



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
    socket.broadcast.to(room).emit('userJoined', { userId: userId, username: username })

    friendSocketIds.forEach(socketId => {
        io.to(socketId).emit('joinRoom',  { userId: userId, username: username });
    })

    console.log(`User ${username} has joined socket room ${room}.`)
}



exports.sendMessage = async (socket, io, users, data) => {
    if (!users[socket.id]) {
        console.log(`User with socket id ${socket.id} is not in any room.`)
        return
    }
    

    const { userId, username, room } = users[socket.id]
    const roomDocument = await Room.findOne({ name: room })

    const newMessage = {
        body: data.message,
        sender: {
            userId: userId,
            username: username
        },
        createdAt: new Date(),
    }
            
    socket.broadcast.to(room).emit("message", newMessage)

    if (roomDocument) {
        roomDocument.messages.push(newMessage)
        await roomDocument.save()
    }   
}



exports.leaveRoom = async (socket, io, users, userIdToSocketIdMap, data) => {
    if (!users[socket.id]) {
        console.log(`User with socket id ${socket.id} is not in any room.`)
        return
    }


    const { userId, username, room } = users[socket.id]
    const roomDocument = await Room.findOne({ name: room })


    socket.broadcast.to(room).emit('userLeft', { userId: userId, username: username })
    delete users[socket.id]
    console.log(`User ${username} has left room ${room}.`)


    if (roomDocument) {
        roomDocument.members = roomDocument.members.filter(member => member.userId !== userId)
        await roomDocument.save()

        if (roomDocument.members.length === 0) {
            locks.lockRoomName(room)

            await Room.deleteOne({ _id: roomDocument._id })

            locks.unlockRoomName(room)
        }
    }

    const roomExists = io.sockets.adapter.rooms[room];
    if (roomExists && roomExists.length === 0) {
        delete io.sockets.adapter.rooms[room]
    }
}