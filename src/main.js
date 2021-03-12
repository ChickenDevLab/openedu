const express = require('express')

const config = require('./utils/config')
const logger = require('./utils/logger')
const db = require('./utils/database')

const configLogger = logger.getLogger('config')
const mainLogger = logger.getLogger('main')

const loginController = require('./controller/login')

config.loadConfig().then(() => { }).catch(() => {
    config.saveConfig()
}).finally(() => {
    configLogger.info('Config loaded')


    const app = express()
    app.set('x-powered-by', false)
    app.set('views', __dirname + '/views')
    app.set('view engine', 'ejs')

    const expressWs = require('express-ws')(app)

    app.use(express.json())

    let connections = []
    mainLogger.info('Registering Websocket-Server')

    mainLogger.info('Register Routes')

    app.post('/api/login/student', loginController.student)
    app.post('/api/login/teacher', loginController.teacher)

    app.listen(config.getConfig().port, () => {
        mainLogger.info('OpenEdu listen on port ' + config.getConfig().port)
    })
})

db.loadDB()

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)

function shutdown() {

    mainLogger.info('OpenEdu shutting down..')
    db.saveDB().then(() => {
        mainLogger.info('Shutting down Logger..')
        logger.shutdown(() => {
            process.exit(0)
        })        
    })
}

