const express = require('express')

const config = require('./utils/config')
const logger = require('./utils/logger')
const db = require('./utils/database')

const RouteRestrictor = require('./auth/restrictor')
const WebSocketGateway = require('./websocket')

const mainLogger = logger.getLogger('main')

const loginController = require('./controller/login')
const meetingController = require('./controller/meetings')

const dispatcher = new (require('cluster-eventdispatcher'))()

module.exports = function (app) {
    config.loadConfig().catch(() => { }).finally(async () => {
        await db.loadDB()

        app.set('x-powered-by', false)
        app.set('views', __dirname + '/views')
        app.set('view engine', 'ejs')

        app.use(express.json())

        mainLogger.info('Register Routes on worker ' + process.pid)

        app.post('/api/login/student', loginController.student)
        app.post('/api/login/teacher', loginController.teacher)
        app.get('/api/login/token/:token', loginController.token)

        const meetingRestictor = new RouteRestrictor(['teacher', 'app'])
        meetingController.init(db)
        app.get('/api/meetings', meetingRestictor.handle, meetingController.meetingsList)
        app.post('/api/meetings/create', meetingRestictor.handle, meetingController.createMeeting)
        app.get('/api/meetings/delete/:id', meetingRestictor.handle, meetingController.deleteMeeting)

        const server = app.listen(config.getConfig().port, () => {
            mainLogger.info('Worker ' + process.pid + ' listen on port ' + config.getConfig().port)
        })

        server.on('error', (err) => {
            dispatcher.dispatch('server:error', err.code)
        })

        new WebSocketGateway(server, '/api/gateway')

    })
}

