const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const ObjectId = mongoose.Types.ObjectId



const userSchema = mongoose.Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    friendsList: { type: [Object], required: true },
    requestsReceived: { type: [Object], required: true },
    requestsSent: { type: [Object], required: true },
    isOnline: { type: Boolean, required: true },
    currentRoom: { type: Number, required: true }
})



userSchema.plugin(uniqueValidator)



module.exports = mongoose.model('User', userSchema)