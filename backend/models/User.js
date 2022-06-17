const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    user: {
        type: String,
        required: [true, 'Please provide a valid user-id'],
        maxlength: 40
    },
    ip: {
        type: String
    },
    board: {
        type: [[String]],
        default: [
            ['', '', '', '', ''],
            ['', '', '', '', ''],
            ['', '', '', '', ''],
            ['', '', '', '', ''],
            ['', '', '', '', ''],
            ['', '', '', '', ''],
        ]
    },
    state: {
        type: String,
        enum: ['running', 'won', 'lose'],
        required: true
    },
    updated: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('User', UserSchema)
