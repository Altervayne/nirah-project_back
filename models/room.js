const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const ObjectId = mongoose.Types.ObjectId



const roomSchema = mongoose.Schema({
    name: { type: Number, required: true, unique: true },
    members: { type: [ObjectId], required: true },
    messages: { type: [Object], required: true }
})



userSchema.plugin(uniqueValidator)



module.exports = mongoose.model('Room', roomSchema)