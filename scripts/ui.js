import { Player, Game, Board, CELL, STATUS } from "./game.js"
import { aiMove } from "./ai.js"

const defaultColor = "rgb(128,128,128)"  //gray
const playColors = ["rgb(36, 238, 181)", "rgb(211, 36, 238)"]

document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startbtn');
    if (startBtn) {
        startBtn.addEventListener('click', init);
    }
});

function init() {

    const player1 = new Player($('#p1name').text(), playColors[0], CELL.P1, false, 1, 3)
    const player2 = new Player($('#p2name').text(), playColors[1], CELL.P2, true, 1, 5)


    const col = parseInt($('#ncol').text())
    const row = parseInt($('#nrow').text())

    const game = new Game(player1, player2, row, col)
    updateConfiguredNames(player1, player2)
    updateGameUi(game, row, col)
    start(game)
}

function start(game) {
    displayResultUi(game)
    updateBoardUi(game.board)

    $('td').click((event) => {
        makePlayerMove(event.target, game);
    })
    if (game.currentPlayer.ai.enabled) {
        makePlayerMove(null, game);
    }
}

function restart(game) {
    game.reinit()
    start(game)
}

function updateBoardUi(board) {
    $('table').html("")

    for (let i = board.trow - 1; i >= 0; i--) {
        let newRow = $('<tr></tr>').text("")
        for (let j = 1; j <= board.tcol; j++) {
            let cell = $('<td></td>').text("")
            cell.attr("id", (j + i * board.tcol - 1).toString())
            newRow.append(cell)
        }
        $('table').append(newRow)
    }
    console.log($('table'))
}


function updateConfiguredNames(player1, player2) {
    if (player1.name === player2.name) {
        player1.name = "^.^"
        player2.name = "^.^"
    }
    $('#p1name').text(player1.name)
    $('#p2name').text(player2.name)
}

function displayResultUi(game) {
    $('#p1wins').text(game.player1.wins);
    $('#p2wins').text(game.player2.wins);
    console.log("update score");

    if (game.board.status === STATUS.FINISHED) {
        if (game.board.draw) {
            alert("game draw!")
        } else {
            alert("we have a winner!")
        }
        /* put a new game */
        restart(game);

        /* TODO: add a announcement corner */
        $('#result').css('visibility', 'visible')
        $('#result').text("We have winner!")
    }
}


function updateGameUi(game) {
    const tcol = game.board.tcol
    const trow = game.board.trow
    let corners = [0, tcol - 1, (tcol * (trow - 1)), trow * tcol - 1]


    console.log(game.currentPlayer)
    for (let i of corners) {
        $("#" + i).css("border-color", game.currentPlayer.color)
    }
    if (game.currentPlayer !== game.player1) {
        $('#dot1').css("visibility", "hidden")
        $('#dot2').css("visibility", "visible")
    } else {
        $('#dot2').css("visibility", "hidden")
        $('#dot1').css("visibility", "visible")
    }
}

async function playMove(board, player, row, col) {
    const cellColor = player.color;
    console.log("row,col: ", row, col);
    console.log(board.cells);

    if (board.getBoardCell(row, col) !== CELL.EMPTY) {
        return 0;
    }

    $('#' + board.getIndex(row, col)).css("background", cellColor);
    const result = await new Promise((resolve) => {
        let intervalId = setInterval(() => {
            if (row === 0 || board.getBoardCell(row - 1, col) !== CELL.EMPTY) {
                clearInterval(intervalId);
                $("#" + (row * board.tcol + col)).text(player.cellValue + 1);
                board.setBoardCell(row, col, player.cellValue);
                resolve(1);
                return;
            }

            $("#" + board.getIndex(row, col)).css("background", defaultColor);
            $("#" + board.getIndex(row - 1, col)).css("background", cellColor);
            row -= 1;
        }, 100);
    });

    return result;
}


async function makePlayerMove(target, game) {
    console.log("clicked!");
    const board = game.board
    if (!game.allowMove) {
        return
    }

    game.allowMove = false;
    while (board.status === STATUS.INPROGRESS) {
        const player = game.currentPlayer
        let row, col;
        if (player.ai.enabled) {
            /* find row, col */
            ({ row, col } = aiMove(board, player));
            console.log("ai move", row, col)
        } else {
            const index = parseInt(target.id);
            ({ row, col } = board.getRowColFromIndex(index));
        }

        const result = await playMove(board, player, row, col)
        if (result === 0) {
            break
        }

        game.switchPlayer()
        board.checkStatus()
        if (board.status === STATUS.FINISHED) {
            game.updateScoreBoard()
            displayResultUi(game)
        }
        updateGameUi(game)

        if (!game.currentPlayer.ai.enabled) {
            break
        }
    }
    game.allowMove = true
}

function makeAiMove(game) {
    return;
    // makePlayerMove(game, row, col);
}

function handleCellClick(game) {

}
