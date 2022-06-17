const User = require('../models/User')
const Wordle = require('../models/Wordle')

const express = require('express')
const router = express.Router()

// @route - /board/verify
// @method - post
// @body {
//     "id": "1ec9cac8-e1c4-4ffe-5bec-4ea4f5e03022",
//     "row": ["P", "I", "Z", "Z", "A"]
// }
// @function - checks wordle
router.post('/verify', async (req, res) => {
    const client_data = req.body

    if (client_data.id === undefined) {
        return res.status(400).json({
            success: false,
            message: 'User-id is required'
        })
    }

    // Check for malformed input
    if (!Array.isArray(client_data.row) || client_data.row.length !== 5) {
        return res.status(400).json({
            success: false,
            message: 'Invalid data. Wordle to check is missing.'
        })
    }

    const user_data = await User.find({
        user: client_data.id
    })

    // User not in database
    if (user_data.length == 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid user-id. Please visit /register to get id.'
        })
    }

    const user_id = user_data[0].user
    const prev_board = user_data[0].board
    const prev_state = user_data[0].state

    let wordle

    // June 30, 2022
    const today  = new Date()
    const updated = today.toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    // Get today's wordle
    const wordle_info = await Wordle.find({
        updated
    })

    // Wordle exists - else create new wordle for today
    if (wordle_info.length) {
        wordle = wordle_info[0].wordle
    } else {
        await Wordle.create({
            wordle: 'PIZZA',
            updated: updated
        })
        wordle = 'PIZZA'
    }

    let message
    let game_state = 'running'
    let correct_letters = 0

    // Evaluate if user input matches correct wordle
    const evaluation = client_data.row.map((letter, index) => {
        if (letter == wordle[index]) {
            correct_letters++
            return 'correct'
        }
        else if (wordle.includes(letter)) {
            return 'present'
        }
        else {
            return 'absent'
        }
    })

    // Playing game same day
    if (user_data[0].updated == updated) {
        // Check if user has already won or lost
        if (prev_state == 'won' || prev_state == 'lose') {
            return res.json({
                success: false,
                message: 'Game over - new wordle will be available tomorrow',
                id: user_id,
                board: prev_board,
                evaluation: Array(5).fill('correct'),
                state: prev_state
            })
        } else {
            // Find first empty row in prev board
            for (let col = 0; col < 6; col++) {
                if (prev_board[col][0] == '') {
                    // Only last row is empty - game over
                    if (col == 5) {
                        game_state = 'lose'
                    }
                    // Add client input to prev board
                    prev_board[col] = client_data.row
                    break
                }
            }

            // Game won - all letters are correct guess
            if (correct_letters == 5) {
                game_state = 'won'
                message = 'Congratulations! You won the wordle'
            } else {
                if (game_state == 'lose') {
                    message = 'You lose this wordle. Come back tomorrow for more.'
                } else {
                    message = 'Not correct. Better luck next time.'
                }
            }

            res.json({
                success: true,
                message: message,
                id: user_id,
                board: prev_board,
                evaluation: evaluation,
                state: game_state
            })

            // Save updated prev board & state to database
            await User.findByIdAndUpdate(
                user_data[0]._id,
                {
                    board: prev_board,
                    state: game_state
                }
            )
        }
    } else {
        const current_board = [client_data.row]

        for (let i = 0; i < 5; i++) {
            current_board.push(Array(5).fill(''))
        }

        // Check if user won
        if (correct_letters == 5) {
            game_state = 'won'
            message = 'Congratulations! You won the wordle'
        } else {
            message ='Not correct. Better luck next time.'
        }

        res.json({
            success: true,
            message: message,
            id: user_id,
            board: current_board,
            evaluation: evaluation,
            state: game_state
        })

        // Reset user board and state
        await User.findByIdAndUpdate(
            user_data[0]._id,
            {
                ip: req.ip,
                board: current_board,
                state: game_state,
                updated: updated
            }
        )
    }
})


module.exports = router
