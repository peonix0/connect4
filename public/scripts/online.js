const url = window.location.origin

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function showMsg(text, color){
    $('#inbox0').text(`> ${text}`)
    $('#inbox0').css('color', color)
}

export const online = {
    lpid: null,
    opid: null,
    totalPlayer: 0,
    inGamePlayers: 0,
    inQueuePlayer: 0,

    async getCountOfOnlineplayers(){
        const response = await fetch(`${url}/playerCount`, {
            method: "GET"
        })
        if(response.ok){
            return await response.json()
        }
    },

    async registerPlayer(name) {
        // idc about name, skip 
        const response = await fetch(`${url}/register`, {
            method: "GET"
        })
        if (response.ok) {
            this.lpid = await response.json().then(data => data.pid);
            console.log('registration successful, pid:', this.lpid)

            // Activate KeepMeAlive updates
            this._sendKeepAliveUpdates()
            return this.lpid
        }
    },

    async _requestArena() {
        let response, arena
        response = await fetch(`${url}/getArena`, {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ pid: this.lpid }),
        })
        if (response.status === 200) {
            arena = await response.json()
            console.log("Arena allotted successfully:", arena)
        }

        if(response.status === 400){
            arena = await response.json()
            console.log("PID couldn't be recognized by server, Restart!")
        }

        return arena
    },

    async getArena() {
        let arena, i = -1
        let arrMsg = ['.', '..', '...'] 
        while (!arena) {
            i = (i + 1)%3;
            arena = await this._requestArena()
            showMsg(`wait ${arrMsg[i]}`)
            await delay(3000)
        }
        return arena
    },

    async canIPlayFirst(){
        let response, reply
        response = await fetch(`${url}/canIPlayFirst`, {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ pid: this.lpid }),
        })
        if (response.status === 200) {
            reply = await response.json()
            console.log("can I play first:", reply.answer)
            return reply.answer === 'YES'
        }
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
        let data, response
        response = await fetch(`${url}/getUpdatedMove`, {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ pid: this.lpid }),
        })

        if (response.status === 200) {
            data = await response.json()
            console.log("recieved opponent move:", data)
        }
        return data
    },

    _sendKeepAliveUpdates() {
        let intervalId = setInterval(() => {
            fetch(`${url}/keepMeAlive`, {
                headers: {
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({ pid: this.lpid }),
            }).then(response => {
                if (!response.ok) {
                    //TODO:
                    console.log("[server not recognizing pid]")
                    clearInterval(intervalId)
                    return "some error"
                }
            })
        }, 40000)
    },

    async getUpdatedMove() {
        let data
        while (!data) {
            data = await this._updateMove()
            await delay(1000)
        }
        return data.move;
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

    sendMsg(text){
        fetch(`${url}/sendMsg`, {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({pid: this.lpid, text: text})
        })
        // I do not guarantee if opponent does recieve it
    },

    async getMsg() {
        let response, msgdata
        response = await fetch(`${url}/getMsg`, {
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ pid: this.lpid }),
        })
        if (response.status === 200) {
            msgdata = await response.json()
        }
        console.log(msgdata)
        return msgdata
    },

    setlock() {
        this.lock = true
    },

    unsetlock() {
        this.lock = false
    }
}

