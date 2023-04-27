const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const userRoutes = require('./routes/user')

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app = express();



const mongoUri = `mongodb+srv://${process.env.MONGODBID}:${process.env.MONGODBPASSWORD}@project-nirah.qttgzaa.mongodb.net/?retryWrites=true&w=majority`
mongoose.connect(mongoUri,
    {   useNewUrlParser: true,
        useUnifiedTopology: true })
        .then(() => console.log('Connection to MongoDB succeeded'))
        .catch(( error ) => console.log( error ))

app.use(express.json())


app.use((request, response, next) => {
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization')
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    next()
})


app.use('/api/auth', userRoutes)

module.exports = app;