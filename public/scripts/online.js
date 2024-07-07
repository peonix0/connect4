const url = window.location.origin

function delay(ms){
    return new Promise(resolve => setTimeout(resolve, ms))
}

export const online = {
    lpid: null,
    opid: null,
    totalPlayer: 0,
    inGamePlayers: 0,
    inQueuePlayer: 0,

    async registerPlayer(name) {
        // idc about name, skip 
        const response = await fetch(`${url}/register`, {
            method: "GET"
        })
        if (response.ok) {
            this.lpid = await response.json().then(data => data.pid);
            console.log('registration successful, pid:', this.lpid)
            return this.lpid
        }
    },

    async getArena() {
        await fetch(`${url}/getArena`, {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ pid: this.lpid }),
        })
    },

    async sendMove(row, col) {
        await fetch(`${url}/addMove`, {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ pid: this.lpid, move: { row: row, col: col } }),
        })
    },

    async _updateMove() {
        let move, response
        response = await fetch(`${url}/getUpdatedMove`, {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ pid: this.lpid }),
        })

        if (response.ok) {
            move = await response.json()
            console.log("recieved opponent move:", move)
        }
        return move
    },

    async getUpdatedMove() {
        let move
        while(!move){
            console.log(move)
            move = await this._updateMove()
        }
        await delay(1000)
        return move;
    },

    getPlayerCount() {
        $.get(`${url}/playerCount`, (data, status) => {
            if (status === 'success') {
                this.totalplayer = data.total
                this.inGamePlayers = data.inGame
                this.inQueuePlayers = data.inQueue
            }
        })
    },

    setlock() {
        this.lock = true
    },

    unsetlock() {
        this.lock = false
    }
}
