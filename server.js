const http = require('http')
const app = require('./app')
const socketio = require('socket.io');
const auth = require('./middleware/auth')

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}



const normalizePort = (port) => {
    const normalizedPort = parseInt(port, 10)

    if (isNaN(normalizedPort)) {
        return port
    }
    if (normalizedPort >= 0) {
        return normalizedPort
    }
    return false
}

const port = normalizePort(process.env.PORT || '4200')
app.set('port', port)

const errorHandler = (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const address = server.address()
    const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + port
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges.')
            process.exit(1)
            break
        case 'EADDRINUSE':
            console.error(bind + ' is already in use.')
            process.exit(1)
            break
        default:
            throw error
    }
}



const server = http.createServer(app)
const io = socketio(server, {
    cors: {
        origin: process.env.CLIENTADDRESS,
        methods: ["GET", "POST"],
        credentials: true,
    }
})



io.use(auth.socket)
require('./socket')(io)

server.on('error', errorHandler)
server.on('listening', () => {
    const address = server.address()
    const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + port
    console.log('Listening on ' + bind)
})



server.listen(port)