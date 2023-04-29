if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}



exports.joinRoom = (socket, users, io) => (data) => {
    const { username, room } = data;
    users[socket.id] = { username, room };

    socket.join(room);
    socket.to(room).broadcast.emit('userJoined', username);
};
  
exports.sendMessage = (socket, users, io) => (message) => {
    const { username, room } = users[socket.id];

    io.to(room).emit('message', { username, message });
};
  
exports.disconnect = (socket, users, io) => () => {
    const { username, room } = users[socket.id];

    socket.to(room).broadcast.emit('userLeft', username);
    delete users[socket.id];
};