const User = require('../models/user')


if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}



exports.addFriend = async (socket, io, users, data) => {
       
}



exports.acceptFriend = async (socket, io, users, data) => {
      
}



exports.rejectFriend = async (socket, io, users, data) => {

}