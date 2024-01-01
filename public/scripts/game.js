
let animeGirlNames = [
    'Hana',
    'Mio',
    'Yuki',
    'Aoi',
    'Sora',
    'Rin',
    'Mika',
    'Nina',
    'Kai',
    'Rumi'
]

/* enums */
const CELL = Object.freeze({
    P1: -1,
    P2: 1,
    EMPTY: 0
})

const STATUS = Object.freeze({
    INPROGRESS: 1,
    FINISHED: 0
})

const ALGO = Object.freeze({
    MINIMAX: 0,
    ABMINIMAX: 1,
})
class Player {
    constructor(name, color, cellValue, aiEnabled, aiAlgo, aiDepth) {
        this.color = color
        this.cellValue = cellValue
        this.depth = 6
        this.wins = 0;
        name = name.trim()
        if (name.length > 10 || name.length < 4 || name === "name?") {
            console.log("Can't you use shorter & better name?")
            this.name = this._getRandomAnimeGirlName()
        } else {
            this.name = name
        }

        if (aiEnabled) {
            this.ai = { enabled: true, algo: aiAlgo, depth: aiDepth }
        }
        else {
            this.ai = { enabled: false, algo: null, depth: null }
        }
    }

    _getRandomAnimeGirlName() {
        const randomIndex = Math.floor(Math.random() * animeGirlNames.length - 1)
        let chosen = animeGirlNames[randomIndex]
        animeGirlNames[randomIndex] = animeGirlNames.pop()
        return chosen
    }
}

class Board {
    constructor(row, col) {
        this.trow = row
        this.tcol = col
        this.draw = false
        this.winner = CELL.EMPTY
        this.status = STATUS.INPROGRESS
        this.cells = this.initializeBoard()
    }

    initializeBoard() {
        return Array.from({ length: this.trow },
            () => Array(this.tcol).fill(CELL.EMPTY)
        )
    }

    init() {
        this.cells.forEach(row => row.fill(CELL.EMPTY));
        this.draw = false;
        this.winner = CELL.EMPTY;
        this.status = STATUS.INPROGRESS;
    }

    getIndex(row, col) {
        return (row) * this.tcol + col
    }

    getRowColFromIndex(index) {
        return {
            row: Math.floor(index / this.tcol),
            col: index % this.tcol
        }
    }

    getBoardCell(row, col) {
        return this.cells[row][col]
    }

    setBoardCell(row, col, cellValue) {
        this.cells[row][col] = cellValue
    }

    checkStatus() {
        throw new Error("checkStatus() function not yet implemented")
    }

}


class Game {
    constructor(player1, player2, row, col) {
        this.board = new Board(row, col)
        this.player1 = player1
        this.player2 = player2

        /* TODO: Select random Player to Start with */
        this.currentPlayer = this.player2
        this.allowMove = true
    }

    reinit() {
        this.board = new Board(this.board.trow, this.board.tcol)
        this.allowMove = true;
    }

    switchPlayer() {
        this.currentPlayer =
            (this.player1 === this.currentPlayer) ?
                (this.player2) : (this.player1)
    }

    updateScoreBoard() {
        if (this.board.status === STATUS.FINISHED) {
            if (this.board.winner === CELL.P1) {
                this.player1.wins++;
            }
            else if (this.board.winner === CELL.P2) {
                this.player2.wins++;
            }
            else {
                this.board.draw = true;
            }
        }
    }
}

function connectedH(board, cellValue) {
    const row = board.trow
    const col = board.tcol
    const cells = board.cells
    let result = { connect2: 0, connect3: 0, winner: 0 }

    for (let i = 0; i < row; i++) {
        let connect = 0
        for (let j = 0; j < col; j++) {
            if (cells[i][j] === cellValue) {
                connect++
                if (connect === 4) {
                    result.winner = 1
                    return result
                }
            } else {
                if (connect === 2) result.connect2++
                else if (connect === 3) result.connect3++
                connect = 0
            }
        }
        if (connect === 2) result.connect2++
        else if (connect === 3) result.connect3++
    }
    return result
}

function connectedV(board, cellValue) {
    const row = board.trow
    const col = board.tcol
    const cells = board.cells
    let result = { connect2: 0, connect3: 0, winner: 0 }

    for (let j = 0; j < col; j++) {
        let connect = 0
        for (let i = 0; i < row; i++) {
            if (cells[i][j] === cellValue) {
                connect++
                if (connect === 4) {
                    result.winner = 1
                    return result
                }
            } else {
                if (connect === 2) result.connect2++
                else if (connect === 3) result.connect3++
                connect = 0
            }
        }
        if (connect === 2) result.connect2++
        else if (connect === 3) result.connect3++
    }
    return result
}

function connectedD(board, cellValue) {
    const rows = board.trow
    const cols = board.tcol
    const cells = board.cells
    let result = { connect2: 0, connect3: 0, winner: 0 }

    // Function to check a single diagonal line
    function checkLine(startRow, startCol, rowStep, colStep) {
        let connect = 0
        let r = startRow
        let c = startCol
        while (r >= 0 && r < rows && c >= 0 && c < cols) {
            if (cells[r][c] === cellValue) {
                connect++
                if (connect === 4) {
                    result.winner = 1
                    return
                }
            } else {
                if (connect === 2) result.connect2++
                else if (connect === 3) result.connect3++
                connect = 0
            }
            r += rowStep
            c += colStep
        }
        if (connect === 2) result.connect2++
        else if (connect === 3) result.connect3++
    }

    // Check all diagonals from top-left to bottom-right
    for (let startRow = 0; startRow < rows; startRow++) {
        checkLine(startRow, 0, 1, 1)  // Start from the left edge
    }
    for (let startCol = 1; startCol < cols; startCol++) {
        checkLine(0, startCol, 1, 1)  // Start from the top edge
    }

    // Check all diagonals from bottom-left to top-right
    for (let startRow = 0; startRow < rows; startRow++) {
        checkLine(startRow, 0, -1, 1)  // Start from the left edge
    }
    for (let startCol = 1; startCol < cols; startCol++) {
        checkLine(rows - 1, startCol, -1, 1)  // Start from the bottom edge
    }

    return result
}



Board.prototype.checkStatus = function() {
    let checksP1 = [
        connectedH(this, -1), connectedV(this, -1), connectedD(this, -1)
    ]
    let checksP2 = [
        connectedH(this, 1), connectedV(this, 1), connectedD(this, 1)
    ]

    for (let check of checksP1) {
        if (check.winner === 1) {
            this.winner = CELL.P1
            this.status = STATUS.FINISHED
            return
        }
    }

    for (let check of checksP2) {
        if (check.winner === 1) {
            this.winner = CELL.P2
            this.status = STATUS.FINISHED
            return
        }
    }

    let isInProgress = this.cells.some(row => row.includes(0))
    if (!isInProgress) {
        this.status = STATUS.FINISHED
    }
}

export {
    Player, Board, Game, CELL, STATUS, ALGO,
    connectedD, connectedV, connectedH
}

