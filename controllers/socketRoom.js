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


    while(locks.isLocked(room, "rooms")) {
        console.log(`Room ${room} is already being created, wait...`)
        await sleep(500)
    }
    


    const currentUserDocument = await User.findOne({ _id: userId })
    const roomDocument = await Room.findOne({ name: room })

    const currentUserFriendIds = currentUserDocument.friendsList.map(friend => friend.userId)
    const friendSocketIds = currentUserFriendIds.map(userId => userIdToSocketIdMap.get(userId))

    const serverMessage = {
        body: `${username} a rejoint le salon`,
        sender: {  
            userId: 0,
            username: "server"
        },
        createdAt: new Date(),
        fromServer: true
    }



    try {
        if (!roomDocument) {
            locks.lock(room, "rooms")


            const newRoom = new Room({
                name: room,
                members: [{ userId: userId, username: username }],
                messages: [],
            })
            await newRoom.save()


            locks.unlock(room, "rooms")
    
        } else {
            let userIsNotInRoom = !roomDocument.members.some(member => member.userId === userId)

            while(locks.isLocked(userId, "users")) {
                console.log(`User with ID ${userId} is already being added to the room, wait...`)
                await sleep(500)

                userIsNotInRoom = false
            }

            if (userIsNotInRoom) {
                locks.lock(userId, "users")

                roomDocument.members.push({ userId: userId, username: username })
                roomDocument.messages.push(serverMessage)
                await roomDocument.save()
                
                locks.unlock(userId, "users")
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



    if(Object.values(users).some(user => user.userId === userId)) {
        console.log(`User with userId ${userId} is already connected.`)
    } else {
        socket.join(room)
        users[socket.id] = { userId, username, room }
        socket.broadcast.to(room).emit('userJoined', { userId: userId, username: username })
        socket.broadcast.to(room).emit('message', serverMessage)

        friendSocketIds.forEach(socketId => {
            io.to(socketId).emit('joinRoom',  { userId: userId, username: username });
        })

        console.log(`User ${username} has joined socket room ${room}.`)
    }

    
    
    currentUserDocument.currentRoom = room
    await currentUserDocument.save()
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
        fromServer: false
    }
            
    socket.broadcast.to(room).emit("message", newMessage)

    if (roomDocument) {
        roomDocument.messages.push(newMessage)
        await roomDocument.save()
    }   
}



exports.leaveRoom = async (socket, io, users, userIdToSocketIdMap, data, callback) => {
    if (!users[socket.id]) {
        console.log(`User with socket id ${socket.id} is not in any room.`)
        return
    }


    const { userId, username, room } = users[socket.id]
    const roomDocument = await Room.findOne({ name: room })
    const currentUserDocument = await User.findOne({ _id: userId })

    const currentUserFriendIds = currentUserDocument.friendsList.map(friend => friend.userId)
    const friendSocketIds = currentUserFriendIds.map(userId => userIdToSocketIdMap.get(userId))

    const serverMessage = {
        body: `${username} a quitté le salon`,
        sender: {  
            userId: 0,
            username: "server"
        },
        createdAt: new Date(),
        fromServer: true
    }



    socket.broadcast.to(room).emit('userLeft', { userId: userId, username: username })
    socket.broadcast.to(room).emit('message', serverMessage)
    delete users[socket.id]

    currentUserDocument.currentRoom = 0
    await currentUserDocument.save()

    friendSocketIds.forEach(socketId => {
        io.to(socketId).emit('leaveRoom',  { userId: userId, username: username });
    })


    
    callback(true)
    console.log(`User ${username} has left room ${room}.`)

    if (roomDocument) {
        roomDocument.members = roomDocument.members.filter(member => member.userId !== userId)
        roomDocument.messages.push(serverMessage)
        await roomDocument.save()

        if (roomDocument.members.length === 0) {
            locks.lock(room, "rooms")

            await Room.deleteOne({ _id: roomDocument._id })

            locks.unlock(room, "rooms")
        }
    }

    

    const roomExists = io.sockets.adapter.rooms[room];
    if (roomExists && roomExists.length === 0) {
        delete io.sockets.adapter.rooms[room]
    }
}