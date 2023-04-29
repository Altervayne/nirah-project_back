const socketControllers = require('./controllers/socket')



const users = {}

module.exports = function(io) {
    io.on('connection', (socket) => {
        socket.on('joinRoom', socketControllers.joinRoom);
        socket.on('sendMessage', socketControllers.sendMessage);
        socket.on('disconnect', socketControllers.disconnect);
    })
}

