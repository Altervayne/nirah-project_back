const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const ObjectId = mongoose.Types.ObjectId



const roomSchema = mongoose.Schema({
    name: { type: String, required: true, unique: true },
    members: { type: [Object], required: true },
    messages: { type: [Object], required: true }
})



roomSchema.plugin(uniqueValidator)



module.exports = mongoose.model('Room', roomSchema)