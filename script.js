const keyboard = document.querySelector('.keyboard')
const grid = document.querySelector('.grid')

const wordle = "PIZZA"

const keys = [
    'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'BACKSPACE', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M'
]

const letter_grid = [
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
]

let current_row = 0, current_grid = 0, game_over = false

let pause_game = true

let guess

keys.forEach(key => {
    const button_element = document.createElement('button')
    button_element.textContent = key
    button_element.setAttribute('id', 'keyboard-' + key.toLowerCase())
    button_element.addEventListener('click', () => button_click(key))
    keyboard.append(button_element)
})

const button_click = (key) => {
    if (game_over) {
        display_message("Game over")
        return
    }

    if (pause_game) { return }

    if (key == 'BACKSPACE') {
        if (current_grid != 0) {
            if (current_grid == 5){
                document.getElementById('grid-column-' + current_row).classList.remove('complete-row')
            } else {
                grid_indicator(current_row, current_grid, reverse=true)
            }
            delete_letter()
        } else {
            display_message("Nothing to delete")
        }

    } else if (key == 'ENTER') {
        if (current_grid == 5) {
            document.getElementById('grid-column-' + current_row).classList.remove('complete-row')

            verify_grids(guess=letter_grid[current_row])
        } else {
            let empty_cells = 0
            letter_grid[current_row].forEach(grid => {
                if (grid == '') {
                    empty_cells++
                }
            })
            if (empty_cells == 1) {
                display_message("Please fill the remaining cell of current row")
            } else if (empty_cells == 5) {
                display_message("Please enter the first letter")
            } else {
                let text

                if (empty_cells == 4){ text = 'four' } else if (empty_cells == 3) { text = 'three' } else { text = 'two' }

                display_message(text + " cells are still blank")
            }
        }
    } else {
        if (current_grid < 5) {
            add_letter(key)
            current_grid++
        } else {
            display_message("Press enter to check current word")
        }
    }
}

const display_message = (message) => {
    const element = document.getElementById('message')
    element.innerHTML = message
    element.style.opacity = 1
    setTimeout(() => { element.style.opacity = 0 }, 2800)
}

const add_letter = (letter) => {
    const grid = document.getElementById('grid-column-' + current_row + '-row-' + current_grid)
    grid.textContent = letter
    letter_grid[current_row][current_grid] = letter
    if (current_grid != 4) {
        grid_indicator(current_row, current_grid + 1)
    } else {
        document.getElementById('grid-column-' + current_row).classList.add('complete-row')
    }
    // Pop animation on type
    grid.classList.add('animate-pop')
    setTimeout(() => {
        grid.classList.remove('animate-pop')
    }, 150)
}

const delete_letter = () => {
    current_grid--
    const grid = document.getElementById('grid-column-' + current_row + '-row-' + current_grid)
    grid.textContent = ''
    letter_grid[current_row][current_grid] = ''
}

const grid_indicator = (row, grid, reverse=false) => {
    if (reverse) {
        document.getElementById('grid-column-' + row + '-row-' + grid).classList.remove('dashed-box')
    
        document.getElementById('grid-column-' + row + '-row-' + (grid - 1)).classList.add('dashed-box')
    
    } else {
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

const verify_grids = (guess) => {
    let counter = 0
    let cards_checked = 0

    for (let i = 0; i < 5; i++) {
        const grid = document.getElementById('grid-column-' + current_row + '-row-' + i)
        const guess_letter = guess[i]

        const keyboard_btn = document.getElementById('keyboard-' + guess_letter.toLowerCase())
        
        // Animate flipping of cards
        setTimeout(() => {
            // Prevents user from typing during animation
            pause_game = true
            if (guess_letter == wordle[i]) {
                counter++
                grid.classList.add('green-card')
                keyboard_btn.classList.add('keyboard-green')
                // All letters are correct guess - win
                if (counter == 5) {
                    display_message("You won")
                    game_over = true
                    bounce()
                    return
                }
            } else if (wordle.includes(guess_letter)) {
                grid.classList.add('yellow-card')
                keyboard_btn.classList.add('keyboard-yellow')
            } else {
                grid.classList.add('grey-card')
                keyboard_btn.classList.add('keyboard-grey')
            }
            cards_checked++
            // All cards in current row are checked
            if (cards_checked == 5) {
                pause_game = false
                if (current_row == 5) {
                    game_over = true
                    display_message("Game over")
                }
                // Shift cursor to next row if game isn't over
                if (!game_over) {
                    current_row++
                    current_grid = 0
                    grid_indicator(current_row, current_grid)
                }
            }
        }, 500 * i)
    }
}

letter_grid.forEach((column, column_index) => {
    const grid_column = document.createElement('div')
    grid_column.setAttribute('id', 'grid-column-' + column_index)
    grid.append(grid_column)
    column.forEach((row, row_index) => {
        const grid_element = document.createElement('div')
        grid_element.setAttribute('id', 'grid-column-' + column_index + '-row-' + row_index)
        grid_column.append(grid_element)
    })
})

grid_indicator(current_row, current_grid)

// Event listener for keyboard inputs
document.addEventListener('keydown', (event) => {
    const key = event.key.toUpperCase()
    if (keys.includes(key)) {
        button_click(key)
        const highlighter = document.getElementById('keyboard-' + key.toLowerCase())
        highlighter.classList.add('animate-click')
        setTimeout(() => {
            highlighter.classList.remove('animate-click')
        }, 200)
    }
})

const welcome_screen = document.querySelector('.instructions-container')

// Hide instructions and start game
welcome_screen.addEventListener('click', () => {
    pause_game = false
    welcome_screen.style.display = 'none'
})

