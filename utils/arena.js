const status = {
  WAIT: "WAIT",
  ONGOING: "ONGOING",
  ENDED: "ENDED"
}

function doMatchMaking(player1, playerPool) {
  let player2, intervalId

  if (playerPool.getCountInQueuePlayers() < 2)
    return { opid: null, error: { status: 101, msg: "Insufficient player count" } }

  playerPool.queueRemovePlayerWithPID(player1.pid)
  player2 = playerPool.queuePopPlayer()

  playerPool.addNewPlayerInGame(player1)
  playerPool.addNewPlayerInGame(player2)

  player1.opponent = player2
  player2.opponent = player1

  player1.state = 'INGAME' //TODO: import state
  player2.state = 'INGAME'
  intervalId = setInterval(() => {
    if (player1.timer >= 0) {
      player1.timer--;
    }
    if (player2.timer >= 0) {
      player2.timer--;
    }

    if (player1.timer < 0 && player1.state !== 'DEAD') {
      player1.state = 'DEAD'
    }
    if (player2.timer < 0 && player2.state !== 'DEAD') {
      player2.state = 'DEAD'
    }

    if (player1.timer < 0 && player2.timer < 0) {
      console.log(`[removed(${player1.timer})]: ${player1.pid}`)
      playerPool.gameRemovePlayerWithPID(player1.pid)

      console.log(`[removed(${player2.timer})]: ${player2.pid}`)
      playerPool.gameRemovePlayerWithPID(player2.pid)

      clearInterval(intervalId)
    }

  }, 1000)

  return { opid: player2.pid, error: { status: 200, msg: null } }
}


class Arena {
  constructor(player1, player2) {
    this.player1 = player1
    this.player2 = player2
    this.status = status.WAIT
    this.winner = null
    this.currentPlayer = this.player1
    this.board = null

    //TODO: INIT board
    //TODO: Randomize currentPlayer
  }

  addMove(col, row) {
    let trow = 0
    for (let i = 0; i < trow; i++) {
      if (!this.board[row][col]) {
        this.board[row][col] = this.currentPlayer.mark;
        this.currentPlayer = this.currentPlayer === this.player1
          ? this.player2 : this.player1
      }
    }


  }

}

module.exports = doMatchMaking
