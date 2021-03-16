const cluster = require('cluster')
const express = require('express')
const cron = require('node-cron')

const workerApp = require('./app')
const logger = require('./utils/logger')
const config = require('./utils/config')
const EventDispatcher = require('cluster-eventdispatcher')

const mainLogger = logger.getLogger('main')
const configLogger = logger.getLogger('config')

const app = express()

function spawnWorker(dispatcher) {
    const worker = cluster.fork()

    dispatcher.initWorker(worker)
    worker.once('online', () => {
        mainLogger.info('Worker ' + worker.process.pid + ' is ready')
    })
    worker.once('exit', () => {
        mainLogger.warn('Worker ' + worker.process.pid + ' died. Starting new worker')
        spawnWorker(dispatcher)
    })
}

if (cluster.isMaster) {
    const dispatcher = new EventDispatcher()
    config.loadConfig().then(() => { }).catch(() => {
        config.saveConfig()
    }).finally(() => {
        configLogger.info('Config loaded')
        mainLogger.info('Starting with spawning workers..')
        for (var i = 0; i < require('os').cpus().length - 1; i++) {
            spawnWorker(dispatcher)
        }
    })

    cron.schedule('*/1 * * * *', () => {
        dispatcher.dispatch('scheduler', '1min')
    })
    cron.schedule('*/5 * * * *', () => {
        dispatcher.dispatch('scheduler', '5min')
    })

    cron.schedule('*/15 * * * *', () => {
        dispatcher.dispatch('scheduler', '15min')
    })

    cron.schedule('* */1 * * *', () => {
        dispatcher.dispatch('scheduler', '1h')
    })
    process.once('SIGINT', shutdown)
    process.once('SIGTERM', shutdown)


} else {
    workerApp(app)
}

function shutdown() {

    mainLogger.info('OpenEdu shutting down..')
    mainLogger.info('Shutting down Logger..')
    logger.shutdown(() => {
        process.exit(0)
    })
}