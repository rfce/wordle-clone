const {v4: uuid} = require('uuid')
const express = require('express')
const router = express.Router()

const User = require('../models/User')

// @route - /register
// @method - get
// @function - register a new user in database
router.get('/register', async (req, res) => {
    const user_ip = req.ip
    const user_data = await User.find({
        ip: user_ip
    })

    // User ip exists in database
    if (user_data.length) {
        const user_id = user_data[0].user
        const board = user_data[0].board
        const game_state = user_data[0].state

        res.json({
            success: false,
            message: 'User already exists',
            user: user_id,
            board: board,
            state: game_state
        })
    } else {
        const user_id = uuid()

        // June 30, 2022
        const today  = new Date()
        const updated = today.toLocaleDateString("en-US", {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })

        await User.create({
            user: user_id,
            ip: user_ip,
            state: 'running',
            updated: updated
        })
        
        res.json({
            success: true, user: user_id
        })
    }
})

module.exports = router
