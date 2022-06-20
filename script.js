// Deploy backend and add url here
const backend = "https://backend-wordle.herokuapp.com"

let state = "running"
let board = Array(6).fill(Array(5).fill(''))
let evaluation = Array(6).fill(Array(5).fill(null))
let pause_game = true
let game_over = false
let current_row = 0
let current_grid = 0

// Returns native user's prev board, evaluation and state
async function previousBoard(user_id) {
    const response = await fetch(backend + '/board/fetch?id=' + user_id)
    const data = await response.json()

    // Incorrect user-id in local storage
    if (data.success == false) {
        localStorage.removeItem('user-id')
    }
    
    return {
        board: data.board,
        evaluation: data.evaluation,
        state: data.state
    }
}

// Registers new user in database, saves in local storage
// Returns user-id
async function register() {
    const response = await fetch(backend + '/register')
    const data = await response.json()
    
    localStorage.setItem('user-id', data.user)

    return {
        success: data.success,
        user_id: data.user
    }
}

// Get and display user's board from database
async function displayBoard() {
    const user_id = localStorage.getItem('user-id')

    // User played wordle before
    if (user_id) {
        const data = await previousBoard(user_id)
        state = data.state
        board = data.board
        evaluation = data.evaluation
    }
    // New user - register in database
    else {
        const data = await register()

        // Register fail - user ip already in databse
        // Get previous board
        if (data.success == false) {
            const prev = await previousBoard(data.user_id)
            state = prev.state
            board = prev.board
            evaluation = prev.evaluation
        }
    }

    game_over = (state != "running")

    const grid = document.querySelector('.grid')

    board.forEach((column, column_index) => {
        const grid_column = document.createElement('div')
        grid_column.setAttribute('id', 'grid-column-' + column_index)
        grid.append(grid_column)

        if (column[0].length) {
            current_row++
        }

        column.forEach((row, row_index) => {
            const grid_element = document.createElement('div')
            grid_element.setAttribute('id', 'grid-column-' + column_index + '-row-' + row_index)
            
            if (row.length) {
                grid_element.textContent = row
                color(grid_element, evaluation[column_index][row_index])
            }

            grid_column.append(grid_element)
        })
    })

    if (game_over == false) {
        grid_indicator(current_row, current_grid)
    }
}

// Adds color class to grid and keyboard
// Value can be correct, present or absent
function color(grid, value) {
    const letter = grid.textContent.toLowerCase()
    const keyboard_btn = document.getElementById('keyboard-' + letter)

    if (value == 'correct') {
        grid.classList.add('green-card')
        keyboard_btn.classList.add('keyboard-green')
    } else if (value == 'present') {
        grid.classList.add('yellow-card')
        keyboard_btn.classList.add('keyboard-yellow')
    } else {
        grid.classList.add('grey-card')
        keyboard_btn.classList.add('keyboard-grey')
    }
}

// Creates on-screen keyboard
function createKeyboard() {
    const keyboard = document.querySelector('.keyboard')
    const keys = [
        'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'BACKSPACE', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M'
    ]

    keys.forEach(key => {
        const button_element = document.createElement('button')
        button_element.textContent = key
        button_element.setAttribute('id', 'keyboard-' + key.toLowerCase())
        button_element.addEventListener('click', () => clicked(key))
        keyboard.append(button_element)
    })

    // Animate on-screen keyboard on key press
    document.addEventListener('keydown', (event) => {
        const key = event.key.toUpperCase()
        if (keys.includes(key)) {
            clicked(key)
            const highlighter = document.getElementById('keyboard-' + key.toLowerCase())
            highlighter.classList.add('animate-click')
            setTimeout(() => {
                highlighter.classList.remove('animate-click')
            }, 200)
        }
    })
}

displayBoard()

// Handles keyboard clicks
async function clicked(key) {
    if (game_over) {
        display_message("Game over")
        return
    }

    if (pause_game) { return }

    const line = document.getElementById('grid-column-' + current_row)

    if (key == 'BACKSPACE') {
        // Not the first cell of current row
        if (current_grid != 0) {
            // Last cell - remove purple row highlight
            // Else shift current grid indicator to previous cell
            if (current_grid == 5){
                line.classList.remove('complete-row')
            } else {
                grid_indicator(current_row, current_grid, reverse=true)
            }

            // Remove letter from current cell
            current_grid--
            const grid = document.getElementById('grid-column-' + current_row + '-row-' + current_grid)
            grid.textContent = ''
            board[current_row][current_grid] = ''
        } else {
            display_message("Nothing to delete")
        }

    } else if (key == 'ENTER') {
        // Last cell
        // Remove purple row highlight & perform wordle check
        if (current_grid == 5) {
            line.classList.remove('complete-row')

            // Send user guess to backend for checking
            const response = await fetch(backend + '/board/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: localStorage.getItem('user-id'),
                    row: board[current_row]
                })
            })

            const data = await response.json()

            if (data.success == false) {
                // User guess isn't valid dictionary word
                if (data.code == 5104) {
                    display_message('Please enter a valid word')
    
                    line.classList.add('animate-shake')
                    setTimeout(() => {
                        line.classList.remove('animate-shake')
                    }, 650)
                } else {
                    display_message('Something went wrong')
                }
                return
            }

            for (let i = 0; i < 5; i++) {
                const cell = document.getElementById('grid-column-' + current_row + '-row-' + i)

                // Animate flipping of cards
                setTimeout(() => {
                    // Prevents user from typing during animation
                    pause_game = true
                    color(cell, data.evaluation[i])

                    // Fifth grid is being checked
                    if (i == 4) {
                        if (data.state == 'won') {
                            display_message("You won")
                            game_over = true
                            bounce()
                        }
                        else if (data.state == 'lose') {
                            display_message("You lose")
                            game_over = true
                        }
                        // Resume game play & shift cursor to next row
                        else {
                            pause_game = false
                            current_row++
                            current_grid = 0
                            grid_indicator(current_row, current_grid)
                        }
                    }
                }, 500 * i)
            }
        } else {
            display_message("Please fill remaining cells of current row")
        }
    } else {
        // User entered a letter
        // Add keyboard input to grid, shift grid indicator to next cell
        if (current_grid < 5) {
            const grid = document.getElementById('grid-column-' + current_row + '-row-' + current_grid)

            grid.textContent = key
            board[current_row][current_grid] = key

            if (current_grid != 4) {
                grid_indicator(current_row, current_grid + 1)
            } else {
                line.classList.add('complete-row')
            }

            // Pop animation on type
            grid.classList.add('animate-pop')
            setTimeout(() => {
                grid.classList.remove('animate-pop')
            }, 150)
            current_grid++
        } else {
            display_message("Press enter to check current word")
        }
    }
}

// Displays information pop-up messages
const display_message = (message) => {
    const element = document.getElementById('message')
    element.innerHTML = message
    element.style.opacity = 1
    setTimeout(() => {
        element.style.opacity = 0
    }, 2800)
}

// Highlights next empty grid
const grid_indicator = (row, grid, reverse=false) => {
    if (reverse) {
        document.getElementById('grid-column-' + row + '-row-' + grid).classList.remove('dashed-box')
    
        document.getElementById('grid-column-' + row + '-row-' + (grid - 1)).classList.add('dashed-box')
    }
    else {
        document.getElementById('grid-column-' + row + '-row-' + grid).classList.add('dashed-box')
    
        if (grid != 0) {
            document.getElementById('grid-column-' + row + '-row-' + (grid - 1)).classList.remove('dashed-box')
        }
    }
}

// Bounce animation on win
const bounce = () => {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const card = document.getElementById('grid-column-' + current_row + '-row-' + i)
            card.classList.add('animate-bounce')
        }, 100 * i)
    }
}

const splash = document.querySelector('.splash-screen')

// Hide instructions and start game
splash.addEventListener('click', () => {
    pause_game = false
    splash.style.display = 'none'
})

createKeyboard()
