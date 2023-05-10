/* Importing Schemas */
const User = require('./models/user')
/* Importing Controllers */
const socketUser = require('./controllers/socketUser')
const socketRoom = require('./controllers/socketRoom')
const socketFriends = require('./controllers/socketFriends')
/* Importing socket.io */
const socketio = require('socket.io')
/* Importing middleware */
const auth = require('./middleware/auth')
/* Declaring required objects and variables */
const userIdToSocketIdMap = new Map()
const users = {}
let io



exports.init = (server) => {
    /* We initiate the websockets by making sure credentials are used */
    io = socketio(server, {
            cors: {
            origin: process.env.CLIENTADDRESS,
            methods: ["GET", "POST"],
            credentials: true,
        }
    })

    /* We make use of the auth middleware to authenticate users and after that we initiate the connection */
    io.use(auth.socket)
    io.on('connection', onConnection)
}



function onConnection(socket) {
    /* We log the succesful connection in the console and map the user's Id to their socketId */
    console.log(`Socket successfully connected: ${socket.id}`)
    console.log(`Connected user: ${socket.auth.username}`)
    console.log(`userId: ${socket.auth.userId}`)
    userIdToSocketIdMap.set(socket.auth.userId, socket.id)


    /* We set the user's online state to true and notify their friends that they have come online */
    socketUser.setUserOnline(socket, true)
    socketFriends.friendConnectionUpdate(socket, io, userIdToSocketIdMap, 'connected')



    /* Basic Join/Leave room controllers */
    socket.on('joinRoom', (data) => {
        socketRoom.joinRoom(socket, io, users, userIdToSocketIdMap, data)
    })
    socket.on('leaveRoom', (data, callback) => {
        socketRoom.leaveRoom(socket, io, users, userIdToSocketIdMap, data, callback)
    })



    /* Room messaging controllers */
    socket.on('sendMessage', (data) => {
        socketRoom.sendMessage(socket, io, users, data)
    })



    /* Friend requests controllers */
    socket.on('friendRequest', (data) => {
        socketFriends.friendRequest(socket, io, userIdToSocketIdMap, data)
    })



    /* Basic Disconnect/Error controllers */
    socket.on('disconnect', async () => {

        /* Get user's friends' Ids and map them to their socket IDs, then send leaveRoom event to notify them */
        const currentUserDocument = await User.findOne({ _id: socket.auth.userId })
        const friendSocketIds = await socketFriends.mapFriendIds(currentUserDocument.friendsList, userIdToSocketIdMap)
        friendSocketIds.forEach(socketId => {
            io.to(socketId).emit('leaveRoom',  { userId: socket.auth.userId, username: socket.auth.username });
        })


        /* Delete disconnecting user's entry in users object and userId to socketId map */
        userIdToSocketIdMap.delete(socket.auth.userId)
        delete users[socket.id]
        

        /* Update disconnecting user's online state in DB and notify friends */
        socketUser.setUserOnline(socket, false)
        await socketFriends.friendConnectionUpdate(socket, io, userIdToSocketIdMap, 'disconnected')


        /* Indicate that disconnection is complete */
        console.log(`Socket successfully disconnected: ${socket.id}`)        
    })
    socket.on('error', (error) => {
        console.error(`Error with socket ${socket.id}:`, error)
    })
}

