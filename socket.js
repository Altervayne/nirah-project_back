const socketRoom = require('./controllers/socketRoom')
const socketFriends = require('./controllers/socketFriends')
const socketio = require('socket.io')
const auth = require('./middleware/auth')
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


    /* Basic Join/Leave room controllers */

    socket.on('joinRoom', (data) => {
        socketRoom.joinRoom(socket, io, users, data)
    })

    socket.on('leaveRoom'), (data) => {
        socketRoom.leaveRoom(socket, io, users, data)
    }


    /* Room messaging controllers */

    socket.on('sendMessage', (data) => {
        socketRoom.sendMessage(socket, io, users, data)
    })


    /* Friend requests controllers */

    socket.on('addFriend', (data) => {
        socketFriends.addFriend(socket, io, users, data)
    })

    socket.on('acceptFriend', (data) => {
        socketFriends.acceptFriend(socket, io, users, data)
    })

    socket.on('rejectFriend', (data) => {
        socketFriends.rejectFriend(socket, io, users, data)
    })


    /* Basic Disconnect/Error controllers */

    socket.on('disconnect', (data) => {
        console.log(`Socket successfully disconnected: ${socket.id}`)        
    })

    socket.on('error', (error) => {
        console.error(`Error with socket ${socket.id}:`, error)
    })
}

