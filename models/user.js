const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')



const userSchema = mongoose.Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    friendsList: { type: [Number], required: true },
    requestsReceived: { type: [Number], required: true },
    requestsSent: { type: [Number], required: true },
    isOnline: { type: Boolean, required: true }
})



userSchema.plugin(uniqueValidator)



module.exports = mongoose.model('User', userSchema)