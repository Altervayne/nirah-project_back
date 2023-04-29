const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const socketio = require('socket.io')

const mongoose = require('mongoose')
const userRoutes = require('./routes/user')




if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}



const app = express();

app.use(cors())
app.use(cookieParser())



const mongoUri = `mongodb+srv://${process.env.MONGODBID}:${process.env.MONGODBPASSWORD}@project-nirah.qttgzaa.mongodb.net/?retryWrites=true&w=majority`
mongoose.connect(mongoUri,
    {   useNewUrlParser: true,
        useUnifiedTopology: true })
        .then(() => console.log('Connection to MongoDB succeeded'))
        .catch(( error ) => console.log( error ))



app.use(express.json())



app.use('/api/auth', userRoutes)



module.exports = app;