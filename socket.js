const socketControllers = require('./controllers/socket')
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
    console.log(`Socket connected: ${socket.id}`)


    socket.on('joinRoom', (data) => {
        socketControllers.joinRoom(socket, io, users, data)
    })

    socket.on('sendMessage', (data) => {
        socketControllers.sendMessage(socket, io, users, data)
    })

    socket.on('leaveRoom', (data) => {
        socketControllers.leaveRoom(socket, io, users, data)
    })

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`)
    })

    socket.on('error', (error) => {
        console.error(`Error with socket ${socket.id}:`, error)
    })
}

