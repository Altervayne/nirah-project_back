const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const userRoutes = require('./routes/user')

const app = express();




app.use(express.json())



app.use((request, response, next) => {
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization')
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    next()
})

module.exports = app;