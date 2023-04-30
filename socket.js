const socketControllers = require('./controllers/socket')
const users = {}



module.exports = function(io) {
    io.on('connection', (socket) => {
        console.log(`socket ${socket.id} connected succesfully with userId: ${socket.auth.userId} | username: ${socket.auth.username}`)

        socket.userId = socket.auth.userId
        socket.username = socket.auth.username

        socket.on('joinRoom', socketControllers.joinRoom);
        socket.on('sendMessage', socketControllers.sendMessage);
        socket.on('disconnect', socketControllers.disconnect);
    })
}

