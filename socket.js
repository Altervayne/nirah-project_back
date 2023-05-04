const socketRoom = require('./controllers/socketRoom')
const socketFriends = require('./controllers/socketFriends')
const socketio = require('socket.io')
const auth = require('./middleware/auth')
const userIdToSocketIdMap = new Map()
const users = {}
let io



exports.init = (server) => {
    io = socketio(server, {
            cors: {
            origin: process.env.CLIENTADDRESS,
            methods: ["GET", "POST"],
            credentials: true,
        }
    })
    io.use(auth.socket)
    io.on('connection', onConnection)
}

function onConnection(socket) {
    console.log(`Socket successfully connected: ${socket.id}`)
    console.log(`Connected user: ${socket.auth.username}`)
    console.log(`userId: ${socket.auth.userId}`)
    userIdToSocketIdMap.set(socket.auth.userId, socket.id)


    /* Basic Join/Leave room controllers */

    socket.on('joinRoom', (data) => {
        socketRoom.joinRoom(socket, io, users, data)
    })

    socket.on('leaveRoom', (data) => {
        socketRoom.leaveRoom(socket, io, users, data)
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

    socket.on('disconnect', () => {
        userIdToSocketIdMap.delete(socket.auth.userId)
        console.log(`Socket successfully disconnected: ${socket.id}`)        
    })

    socket.on('error', (error) => {
        console.error(`Error with socket ${socket.id}:`, error)
    })
}

