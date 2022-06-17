const mongoose = require('mongoose')

const WordleSchema = new mongoose.Schema({
    wordle: {
        type: String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 5
    },
    updated: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model('Wordle', WordleSchema)
