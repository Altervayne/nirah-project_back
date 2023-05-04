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
    console.log(`Socket successfully connected: ${socket.id}`)
    console.log(`Connected user: ${socket.auth.username}`)
    console.log(`userId: ${socket.auth.userId}`)


    socket.on('joinRoom', (data) => {
        socketControllers.joinRoom(socket, io, users, data)
    })

    socket.on('sendMessage', (data) => {
        socketControllers.sendMessage(socket, io, users, data)
    })

    socket.on('leaveRoom'), (data) => {
        socketControllers.leaveRoom(socket, io, users, data)
    }

    socket.on('disconnect', (data) => {
        console.log(`Socket successfully disconnected: ${socket.id}`)        
    })

    socket.on('error', (error) => {
        console.error(`Error with socket ${socket.id}:`, error)
    })
}

