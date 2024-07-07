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

    // not using
    this.name = null
    this.state = playerState.INQUEUE

    // this keeps the opponent move until requested by player
    this.socket = null

    /* if player doesn't interact with server for 60 secs, server will assume
     * player as dead (disconnected) 
     */
    this.timer = 30  // 60secs
  }

  _generatePID() {
    return '_' + Math.random().toString(36).substr(2, 9)
  }

  setPlayerState(state) {
    this.state = state
  }

  resetTimer() {
    this.timer = 30
  }
  
  setExpire(){
    this.timer = -1
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

  getPlayerWithPID(pid) {
    return this.inGamePlayers.find(player => player.pid === pid) || this.inQueuePlayers.find(player => player.pid === pid)
  }

  gameRemovePlayerWithPID(pid) {
    this.inGamePlayers = this.inGamePlayers.filter(player => player.pid !== pid)
  }

  queuePopPlayer() {
    return this.inQueuePlayers.pop();
  }

  queueRemovePlayerWithPID(pid) {
    this.inQueuePlayers = this.inQueuePlayers.filter(player => player.pid !== pid)
  }

  addNewPlayer(player) {
    this.inQueuePlayers.push(player)
    console.log(`[added(${this.getCountInQueuePlayers()})]: ${player.pid}`)
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
  return await new Promise((resolve) => {
    req.on('data', chunk => {
      data += chunk.toString();
    })

    req.on('end', () => {
      const parsedData = JSON.parse(data);
      console.log("[Recieved]:", parsedData)
      if (parsedData !== undefined)
        resolve({ data: parsedData, error: { status: 200, msg: null } })
      else
        resolve({ data: null, error: { status: 404, msg: 'Invalid request data' } })
    })
  })
}

// Assuming POST data in JSON
async function gogoReadPostGetPID(req) {
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
        resolve({ pid: parsedData.pid, error: { status: 200, msg: null } })
      else
        resolve({ pid: null, error: { status: 404, msg: 'Invalid request data' } })
    })
  })
}

async function gogohandler(req, res) {
  console.log(`{${req.method}, ${req.url}}`)
  const parsedUrl = url.parse(req.url, true)
  let error = { status: null, msg: null }

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
    let player = new Player()

    playerPool.addNewPlayer(player)
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ pid: player.pid }))
  }
  else if (parsedUrl.pathname === '/getArena' && req.method === 'POST') {
    let pid, opid

    ({ pid, error } = await gogoReadPostGetPID(req))

    if (pid !== undefined) {
      let player = playerPool.getPlayerWithPID(pid)

      if (player === undefined) {
        error = { status: 400, msg: `PID ${pid} not registered` }
      }
      else if (player.opponent) {
        opid = player.opponent.pid
      }
      else if (playerPool.getCountInQueuePlayers < 2) {
        error = { status: 333, msg: "Insufficient player count" }
      }
      else {
        ({ opid, error } = doMatchMaking(player, playerPool))
      }
    }

    if (!error.msg) {
      res.statusCode = 200
      res.end((JSON.stringify({ Ypid: pid, Opid: opid })))
    }
  }
  else if (parsedUrl.pathname === '/addMove' && req.method === 'POST') {
    let player, data

    ({ data, error } = await gogoReadPost(req))
    if (data.pid !== undefined) {
      player = playerPool.getPlayerWithPID(data.pid)

      if (player !== undefined) {
        player.resetTimer()

        if (player.opponent && player.opponent.state !== playerState.DEAD) {
          player.opponent.socket = data.move
          res.statusCode = 200
          res.end()
        } else {
          player.setExpire()
          error = { status: 400, msg: 'Opponent disconnected' }
        }
      } else {
        error = { status: 400, msg: `PID ${data.pid} not registered` }
      }
    }
  }
  else if (parsedUrl.pathname === '/getUpdatedMove' && req.method === 'POST') {
    let data
    ({ data, error } = await gogoReadPost(req))

    if (data.pid !== undefined) {
      let player = playerPool.getPlayerWithPID(data.pid)

      if (player === undefined) {
        error = { status: 400, msg: `PID ${data.pid} not registered` }
      }
      else if (player.opponent.state === playerState.DEAD) {
        player.setExpire()
        error = { status: 400, msg: 'Opponent disconnected' }
      }
      else if (player.socket) {
        player.resetTimer()
        res.statusCode = 200
        res.end(JSON.stringify(player.socket))
        player.socket = null
      } else {
        player.resetTimer()
        error = { status: 333, msg: 'Wait...' }
      }
    }

  }
  else if (parsedUrl.pathname === '/keepMeAlive' && req.method === 'POST') {
    let data
    ({ data, error } = await gogoReadPost(req))

    if (!error.msg && data.pid !== undefined) {
      let player = playerPool.getPlayerWithPID(data.pid)

      if (player !== undefined) {
        player.resetTimer()
        res.statusCode = 200
        res.end()
      } else {
        error = { status: 400, msg: `PID ${data.pid} not registered` }
      }
    }
  }
  else if (req.method === 'GET') {
    // requestin our main page, server static content
    gogoServeStatic(parsedUrl.pathname, res)
  }

  if (error.msg) {
    console.log(error)
    res.statusCode = error.status || 404
    res.end(JSON.stringify(error))
  }
}

// Create PlayerPool
const playerPool = new PlayerPool()

const server = http.createServer(gogohandler)
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`)
})

