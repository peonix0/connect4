const status = {
  WAIT: "WAIT",
  ONGOING: "ONGOING",
  ENDED: "ENDED"
}

function doMatchMaking(player1, playerPool) {
  if (playerPool.getCountInQueuePlayers() < 2)
    return { opid: null, errorMsg: "Unsufficient player count" }

  playerPool.removePlayerWithID(player1.pid)
  let player2 = playerPool.queuePopPlayer()

  playerPool.addNewPlayerInGame(player1)
  playerPool.addNewPlayerInGame(player2)

  player1.opponent = player2
  player2.opponent = player1
  return { opid: player2.pid, errorMsg: null }
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
