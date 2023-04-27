const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const ObjectId = mongoose.Types.ObjectId



const userSchema = mongoose.Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    friendsList: { type: [ObjectId], required: true },
    requestsReceived: { type: [ObjectId], required: true },
    requestsSent: { type: [ObjectId], required: true },
    isOnline: { type: Boolean, required: true },
    currentRoom: { type: Number, required: true }
})



userSchema.plugin(uniqueValidator)



module.exports = mongoose.model('User', userSchema)