const http = require('http')
const url = require('url')
const gogoServeStatic = require('./utils/serveStatic.js')
const doMatchMaking = require('./utils/arena.js')

const host = 'localhost'
const port = 3000

const playerState = {
  INGAME: 'INGAME',
  INQUEUE: 'INQUEUE',

  DEAD: 'DEAD'
}

class Player {
  constructor() {
    this.pid = this._generatePID()
    this.opponent = null
    this.name = null
    this.state = playerState.INQUEUE
    this.lastMove = null
    this.socket = null
  }

  _generatePID() {
    return '_' + Math.random().toString(36).substr(2, 9)
  }

  setPlayerState(state) {
    this.state = state
  }
}

class PlayerPool {
  constructor() {
    this.inGamePlayers = []
    this.inQueuePlayers = []
  }

  getCountInGamePlayers() {
    return this.inGamePlayers.length
  }

  getCountInQueuePlayers() {
    return this.inQueuePlayers.length
  }

  getCountTotalPlayers() {
    return this.inGamePlayers.length + this.inQueuePlayers.length
  }

  getPlayerWithID(pid) {
    return this.inGamePlayers.find(player => player.pid === pid) || this.inQueuePlayers.find(player => player.pid === pid)
  }

  removePlayerWithID(pid) {
    this.inGamePlayers = this.inGamePlayers.filter(player => player.pid !== pid)
    this.inQueuePlayers = this.inQueuePlayers.filter(player => player.pid !== pid)
  }

  queuePopPlayer() {
    return this.inQueuePlayers.pop();
  }

  queueRemovePlayerWithPID(pid) {
    this.inQueuePlayers = this.inQueuePlayers.filter(player => player.pid !== pid)
  }

  addNewPlayer(player) {
    this.inQueuePlayers.push(player)
  }

  addNewPlayerInGame(player) {
    player.setPlayerState(playerState.INGAME)
    this.inGamePlayers.push(player)
  }
}

async function gogoReadPost(req) {
  if (req.method !== 'POST')
    return { data: undefined, errorMsg: "invalid method" }

  let data = ''
  return await new Promise((resolve, reject) => {
    req.on('data', chunk => {
      data += chunk.toString();
    })

    req.on('end', () => {
      const parsedData = JSON.parse(data);
      console.log("[Recieved]:", parsedData)
      if (parsedData !== undefined)
        resolve({ data: parsedData, errorMsg: null })
      else
        resolve({ data: null, errorMsg: "invalid data" })
    })
  })
}

// Assuming POST data in JSON
async function gogoReadPostGetPid(req) {
  if (req.method !== 'POST')
    return { data: undefined, errorMsg: "invalid method" }

  let data = ''
  return await new Promise((resolve, reject) => {
    req.on('data', chunk => {
      data += chunk.toString();
    })

    req.on('end', () => {
      const parsedData = JSON.parse(data);
      if (parsedData.pid !== undefined)
        resolve({ pid: parsedData.pid, errorMsg: null })
      else
        resolve({ pid: null, errorMsg: "invalid data" })
    })
  })
}

async function gogohandler(req, res) {
  console.log(`{${req.method}, ${req.url}}`)
  const parsedUrl = url.parse(req.url, true)

  if (parsedUrl.pathname === '/playerCount' && req.method === 'GET') {
    const data = {
      total: playerPool.getCountTotalPlayers(),
      inGame: playerPool.getCountInGamePlayers(),
      inQueue: playerPool.getCountInQueuePlayers()
    }
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(data))
  }
  else if (parsedUrl.pathname === '/register' && req.method === 'GET') {
    // this add player to queue and returns player card
    let player = new Player()
    playerPool.addNewPlayer(player)
    // return PID as json
    res.setHeader('Content-Type', 'application/json')
    console.log(`[added]: ${player.pid}`)
    res.end(JSON.stringify({ pid: player.pid }))
  }
  else if (parsedUrl.pathname === '/getArena' && req.method === 'POST') {
    let pid, opid, errorMsg
    ({ pid, errorMsg } = await gogoReadPostGetPid(req))

    if (pid !== undefined) {
      let player = playerPool.getPlayerWithID(pid)

      if (player === undefined) {
        errorMsg = `PID ${pid} not registered`
      }
      else if (player.opponent) {
        opid = player.opponent.pid
      }
      else if (playerPool.getCountInQueuePlayers < 2) {
        errorMsg = "Unsufficient player count"
      }
      else {
        ({ opid, errorMsg } = doMatchMaking(player, playerPool))
        let arena
        // ({ arena, opid, errorMsg } = arena.createArena(player))

        if (errorMsg) {
          //TODO: set error
        }
      }
    }

    if (errorMsg) {
      console.log(errorMsg)
      res.statusCode = 400
      // TODO: write error msg
      res.end()
    }
    else {
      res.statusCode = 200
      res.end((JSON.stringify({ Ypid: pid, Opid: opid })))
    }
  }
  else if(parsedUrl.pathname === '/addMove' && req.method === 'POST'){
    let {data, errorMsg} = await gogoReadPost(req)
    let pid = data.pid
    let move = data.move
    let player = playerPool.getPlayerWithID(pid)

    player.opponent.socket = data.move
    res.statusCode = 200
    res.end()
  }
  else if(parsedUrl.pathname === '/getUpdatedMove' && req.method === 'POST'){
    let {data, errormsg} = await gogoReadPost(req)
    let pid = data.pid
    let player = playerPool.getPlayerWithID(pid)

    if(player.socket){
      res.statusCode = 200
      res.end(JSON.stringify(player.socket))
      player.socket = null
    }else{
      res.statusCode = 300
      res.end()
    }
  }
  else if (req.method === 'GET') {
    // requestin our main page, server static content
    gogoServeStatic(parsedUrl.pathname, res)
  }
  else {
    res.statusCode = 404
    res.statusMessage = "Invalid Request"
    res.end("{Error: 404}")
  }

}

// Create PlayerPool
const playerPool = new PlayerPool()

const server = http.createServer(gogohandler)
server.listen(port,'192.168.43.198', () => {
  console.log(`Server running at http://localhost:${port}/`)
})

