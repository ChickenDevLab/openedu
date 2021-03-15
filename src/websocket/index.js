const ws = require('ws')
const db = require('../utils/database')

const EventDispatcher = require('cluster-eventdispatcher')

const logger = require('../utils/logger').getLogger('gateway')

class WebSocketGateway {
    constructor(server, path) {
        this._server = server
        this.path = path

        this._usedTokens = {}

        this._dispatcher = new EventDispatcher()

        this.wss = new ws.Server({
            noServer: true,
            clientTracking: true
        })

        this._dispatcher.on('gateway:connect', data => {
            this._usedTokens[data.token] = true
        })

        this._dispatcher.on('gateway:disconnect', data => {
            delete this._usedTokens[data.token]
        })
        server.on('upgrade', (request, socket, head) => {
            if (request.url.startsWith(path)) {
                const urlParts = request.url.split('/')
                db.getLoginToken(urlParts[urlParts.length - 1]).then(info => {
                    if (info) {
                        if (this._usedTokens[info.token]) {
                            logger.http('User ' + info.name + ' is allready connected, but wants to connect again from ' + request.socket.remoteAddress)
                            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
                            socket.destroy()
                        } else {
                            this.wss.handleUpgrade(request, socket, head, (ws) => {
                                
                                ws.user = info
                                ws.user.ip = request.socket.remoteAddress
                                this.wss.emit('connection', ws, request)

                                ws.on('close', () => {
                                    
                                })
                            })
                            logger.http('User ' + info.name + ' connected to gateway from ' + request.socket.remoteAddress)
                            this._dispatcher.dispatch('gateway:connect', info)
                        }
                    } else {
                        logger.http('User tried to connect gateway from ' + request.socket.remoteAddress + ' with invalid token')
                        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
                        socket.destroy()
                    }
                })

            } else {
                socket.destroy()
            }
        })
        this.wss.on('connection', (ws) =>{
            ws.on('close', () => {
                this._dispatcher.dispatch('gateway:disconnect', ws.user)
                logger.http('User ' + ws.user.name + ' (' + ws.user.ip + ') disconnected from the gateway')
            })
        })
    }
}

module.exports = WebSocketGateway