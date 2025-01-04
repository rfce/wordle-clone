const authRoute = require('./routes/Auth')
const boardRoute = require('./routes/Board')

const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cron = require('node-cron')
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

// Schedule a task to run every 2 minutes
cron.schedule('*/2 * * * *', () => {
    const timestamp = new Date().toISOString()
    console.log(timestamp)
})

app.listen(port, () => {
    console.log('Server running on ' + port)
})
