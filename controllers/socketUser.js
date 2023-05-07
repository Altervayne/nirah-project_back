const User = require('../models/user')



exports.setUserOnline = async (socket, state) => {
    const userId = socket.auth.userId

    const currentUser = await User.findOne({ _id: userId })
    currentUser.isOnline = state

    currentUser.save()
}