const { MongoError } = require('mongodb')
const socketFriends = require('./socketFriends')
const Room = require('../models/room')
const User = require('../models/user')
const locks = require('../helpers/locks')



if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}



function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}




exports.joinRoom = async (socket, io, users, userIdToSocketIdMap, data, callback) => {
    /* We initialize the following constants out of the user's auth token */
    const userId = socket.auth.userId
    const username = socket.auth.username
    const room = `${data.roomId}`

    /* We check if the server has correctly initialized the io object */
    if (!io || !io.sockets || !io.sockets.adapter) {
        console.error("Error: io is not defined or initialized correctly")

        callback(false)
        return
    }

    /* We check if the requested room is locked. If it is, it means it is being created already */
    /* So we force the current request to wait half a second for the previous one to complete */
    while(locks.isLocked(room, "rooms")) {
        console.log(`Room ${room} is already being created, wait...`)
        await sleep(500)
    }
    
    /* We get the necessary documents and a map of the user's friends' Ids to their socket Ids */
    const currentUserDocument = await User.findOne({ _id: userId })
    const roomDocument = await Room.findOne({ name: room })
    const friendSocketIds = await socketFriends.mapFriendIds(currentUserDocument.friendsList, userIdToSocketIdMap)

    /* We create the server message that will be emitted */
    const serverMessage = {
        body: `${username} a rejoint le salon`,
        sender: {  
            userId: 0,
            username: "server"
        },
        createdAt: new Date(),
        fromServer: true
    }



    /* Now, we check to see if the room document exists */
    try {

        /* If it does not, it is time to create it */
        if (!roomDocument) {

            /* We lock the requested room name to avoid conflicting requests */
            locks.lock(room, "rooms")

            /* We create a new room object with the current user added in the members list by default and then save it */
            const newRoom = new Room({
                name: room,
                members: [{ userId: userId, username: username }],
                messages: [],
            })
            await newRoom.save()

            /* Once the save is finished, we unlock the room name to indicate to other requests that the room is created */
            locks.unlock(room, "rooms")
    

        /* If it does exist, we just get the user to join */    
        } else {

            /* We check if the user is indeed not in the room to avoid adding duplicate users to the room object */
            let userIsNotInRoom = !roomDocument.members.some(member => member.userId === userId)



            /* If the current user's ID is locked, that means it is already being added to the room, so we wait */
            while(locks.isLocked(userId, "users")) {
                console.log(`User with ID ${userId} is already being added to the room, wait...`)
                await sleep(500)

                userIsNotInRoom = false
            }



            /* If, however, the user isn't in any rooms, we can proceed to add them */
            if (userIsNotInRoom) {

                /* We start by locking their userId to avoid duplicates */
                locks.lock(userId, "users")

                /* Then we push the user to the roomDocument's members array, then we push the serverMessage and save */
                roomDocument.members.push({ userId: userId, username: username })
                roomDocument.messages.push(serverMessage)
                await roomDocument.save()
                
                /* We finally unlock the userId */
                locks.unlock(userId, "users")
            }
        }
    }

    /* In case of any errors, we catch them and display them in the console, while also notifying the client */
    catch (error) {
        if (error instanceof MongoError && error.code === 11000) {
            socket.emit("sameRoomName", { message: "Room with same name was being created at the same time, wait for connection..." })
        } else {
            callback(false)
            console.error(error)
        }
    }

    /* We now check to see if the socket room exists already and if it doesn't we initialize it */
    const roomExists = io.sockets.adapter.rooms[room];
    if (!roomExists) {
        io.sockets.adapter.rooms[room] = {
            sockets: {},
            length: 0,
        }
    }



    /* Before adding the user to the socket room, we check if they aren't already in there */
    if(Object.values(users).some(user => user.userId === userId && user.room === room)) {
        console.log(`User with userId ${userId} is already connected to room ${room}.`)
    }
    
    /* If they aren't, we can safely proceed */
    else {

        /* We make the user join the socket room, and add them to our users object to track them */
        socket.join(room)
        users[socket.id] = { userId, username, room }

        /* We then broadcast that the user has joined the room */
        socket.broadcast.to(room).emit('userJoined', { userId: userId, username: username })
        socket.broadcast.to(room).emit('message', serverMessage)

        /* And we broadcast to each online friend that the user has joined a room */
        friendSocketIds.forEach(socketId => {
            io.to(socketId).emit('joinRoom',  { userId: userId, username: username });
        })

        /* We log the succesful connection in the console */
        console.log(`User ${username} has joined socket room ${room}.`)
    }

    

    /* And finally, we set the current user's room in their document and return true to the callback function */
    currentUserDocument.currentRoom = room
    currentUserDocument.save()
    callback(true)
}



exports.sendMessage = async (socket, io, users, data) => {
    /* We check that the message isn't an empty string */
    if(!data.message) {
        return
    } else {
        /* We first check if the user is in a room before sending the message */
        if (!users[socket.id]) { return }
        const { userId, username, room } = users[socket.id]

        /* We get the room's document to prepare to update it with the new message */
        const roomDocument = await Room.findOne({ name: room })

        /* We create the new message object and only keep the message's body from the request */
        /* This ensures that the data included in the message and sent to other users is authentic */
        /* And not a falsified date or falsified sender object */
        const newMessage = {
            body: data.message,
            sender: {
                userId: userId,
                username: username
            },
            createdAt: new Date(),
            fromServer: false
        }

        /* We broadcast the message to the room */        
        socket.broadcast.to(room).emit("message", newMessage)

        /* We then push the message in the room document's messages array */
        if (roomDocument) {
            roomDocument.messages.push(newMessage)
            await roomDocument.save()
        } 
    } 
}



exports.leaveRoom = async (socket, io, users, userIdToSocketIdMap, data, callback) => {
    /* If the user isn't registered in the users object, there was a problem establishing connection */
    if (!users[socket.id]) { return }
    const { userId, username, room } = users[socket.id]

    /* We get the necessary documents and a map of the user's friends' Ids to their socket Ids */
    const roomDocument = await Room.findOne({ name: room })
    const currentUserDocument = await User.findOne({ _id: userId })
    const friendSocketIds = await socketFriends.mapFriendIds(currentUserDocument.friendsList, userIdToSocketIdMap)

    /* We create the server message that will be emitted */
    const serverMessage = {
        body: `${username} a quitté le salon`,
        sender: {  
            userId: 0,
            username: "server"
        },
        createdAt: new Date(),
        fromServer: true
    }



    /* We broadcast the userLeft and message events to notify that the user has left the room */
    /* and we then delete the user's entry in the users object */
    socket.broadcast.to(room).emit('userLeft', { userId: userId, username: username })
    socket.broadcast.to(room).emit('message', serverMessage)
    delete users[socket.id]

    /* We notify their currently online friends that the current user isn't in a room anymore */
    friendSocketIds.forEach(socketId => {
        io.to(socketId).emit('leaveRoom',  { userId: userId, username: username });
    })


    
    /* We send true to the callback function to indicate to the client that the user has properly left the room */
    callback(true)
    console.log(`User ${username} has left room ${room}.`)



    /* We update the room's document */
    if (roomDocument) {

        /* By first filtering out the user that just left and pushing the server message in the history */
        roomDocument.members = roomDocument.members.filter(member => member.userId !== userId)
        roomDocument.messages.push(serverMessage)
        await roomDocument.save()

        /* And if the leaving user was the last one, we remove the room by first locking it to avoid any conflicting */
        /* requests, like someone trying to join/create a room with the same name */
        if (roomDocument.members.length === 0) {
            locks.lock(room, "rooms")

            await Room.deleteOne({ _id: roomDocument._id })

            locks.unlock(room, "rooms")
        }
    }

    

    /* We do the same to the socket room. If there are no more users, we delete it */
    const roomExists = io.sockets.adapter.rooms[room];
    if (roomExists && roomExists.length === 0) {
        delete io.sockets.adapter.rooms[room]
    }
}