const socketControllers = require('./controllers/socket')
const auth = require('./middleware/auth')



const users = {}

module.exports = function(io) {
    io.on('connection', (socket) => {
        socket.on('joinRoom', auth.socket , socketControllers.joinRoom);
        socket.on('sendMessage', auth.socket, socketControllers.sendMessage);
        socket.on('disconnect', auth.socket, socketControllers.disconnect);
    })
}

