import { connectedH, connectedV, connectedD, CELL, STATUS, ALGO } from "./game.js"


function simpleEvaluator(board, playerCellValue) {

    const cells = board.cells
    const opponentCellValue = playerCellValue === CELL.P1 ? CELL.P2 : CELL.P1;
    let score = 0;

    const centerColumn = cells.map(row => row[Math.floor(cells[0].length / 2)]);
    const centerCount = centerColumn.filter(cell => cell === playerCellValue).length;
    score += centerCount * 10;  // Center column control is typically weighted higher

    score += scorePosition(board, playerCellValue, opponentCellValue, connectedH);
    score += scorePosition(board, playerCellValue, opponentCellValue, connectedV);
    score += scorePosition(board, playerCellValue, opponentCellValue, connectedD);

    return score;
}

// Helper function to score positions based on 2's, 3's, and 4's
function scorePosition(board, playerCellValue, opponentCellValue, checkFunction) {
    const playerResult = checkFunction(board, playerCellValue);
    const opponentResult = checkFunction(board, opponentCellValue);
    let positionScore = 0;

    if (playerResult.winner) positionScore += 100000;
    positionScore += playerResult.connect3 * 100;
    positionScore += playerResult.connect2 * 10;
    if (opponentResult.winner) positionScore -= 100000;
    positionScore -= opponentResult.connect3 * 90;
    positionScore -= opponentResult.connect2 * 10;

    return positionScore;
}

function minimax(board, alpha, beta, playerCellValue, depth, maximizer, pruning) {
    let move = null
    let result
    let opponentCellValue = -1 * playerCellValue

    if (depth <= 0) {
        return { score: simpleEvaluator(board, playerCellValue), move: null }
    }

    console.log("ami being called ?")
    if (maximizer) {
        let maxv = Number.MIN_SAFE_INTEGER
        for (let j = 0; j < board.tcol; j++) {
            for (let i = 0; i < board.trow; i++) {
                if (board.cells[i][j] === CELL.EMPTY) {
                    board.setBoardCell(i, j, playerCellValue)
                    let result = minimax(board, alpha, beta, playerCellValue, depth - 1, false)
                    if(depth === 3){
                        console.log("col", j, ", score:", result.score)
                    }

                    if (maxv < result.score) {
                        maxv = result.score
                        move = { row: i, col: j }
                        alpha = Math.max(alpha, result.score)
                    }
                    board.setBoardCell(i, j, CELL.EMPTY)
                    if (beta <= alpha) {
                        return { score: maxv, move: move }
                    }
                    break
                }
            }
            if (depth === 3) {
                console.log("max:", move)
            }
        }

        return { score: maxv, move: move }
    }

    /* minimizer */
    let minv = Number.MAX_SAFE_INTEGER
        for (let j = 0; j < board.tcol; j++) {
        for (let i = 0; i < board.trow; i++) {
            if (board.cells[i][j] === CELL.EMPTY) {
                board.setBoardCell(i, j, opponentCellValue)
                result = minimax(board, alpha, beta, playerCellValue, depth - 1, true)
                board.setBoardCell(i, j, CELL.EMPTY)
                minv = Math.min(minv, result.score)
                beta = Math.min(beta, result.score)
                if (beta <= alpha && pruning) {
                    return { score: minv, move: null }
                }
                break
            }
        }
    }
    return { score: minv, move: null }
}



function monteCarlos() {

}

/* need to consider somethins about valid moves only */

export function aiMove(board, player) {
    let bestMove
    let cellValue = player.cellValue
    let depth = player.ai.depth

    if (player.ai.algo === ALGO.ABMINIMAX) {
        bestMove = minimax(board, -Infinity, +Infinity, cellValue, depth, true, true)
    } else if (player.ai.algo === ALGO.MINIMAX) {
        bestMove = minimax(board, -Infinity, +Infinity, cellValue, depth, true, false)
    }

    console.log("from ai.js:", bestMove)
    return bestMove.move
    /* this will return best move for current state of board */
}

function advancedEvaluator() {


}



