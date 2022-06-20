const authRoute = require('./routes/Auth')
const boardRoute = require('./routes/Board')

const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
const dotenv = require('dotenv')
dotenv.config()

const port = process.env.PORT
const MONGO_URI = process.env.MONGO_URI

// Client's ip is derived from the x-forwarded-for header
app.set('trust proxy', true)

app.use(express.json())

app.use(express.urlencoded({
    extended: false
}))

app.use(cors({
    origin: process.env.ORIGIN
}))

app.use('/', authRoute)
app.use('/board', boardRoute)

mongoose.connect(MONGO_URI).catch((error) => {
    console.log('[-] Error connecting to database - index.js')
    console.log(error)
})

app.listen(port, () => {
    console.log('Server running on ' + port)
})
