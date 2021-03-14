const express = require('express')

const config = require('./utils/config')
const logger = require('./utils/logger')
const db = require('./utils/database')

const mainLogger = logger.getLogger('main')

const loginController = require('./controller/login')

module.exports = function (app) {
    config.loadConfig().catch(() => {}).finally(async () => {
        await db.loadDB()

        app.set('x-powered-by', false)
        app.set('views', __dirname + '/views')
        app.set('view engine', 'ejs')

        app.use(express.json())

        mainLogger.info('Register Routes on worker ' + process.pid)

        app.post('/api/login/student', loginController.student)
        app.post('/api/login/teacher', loginController.teacher)
        app.get('/api/login/token/:token', loginController.token)

        app.listen(config.getConfig().port, () => {
            mainLogger.info('Worker ' + process.pid + ' listen on port ' + config.getConfig().port)
        })
    })
}

