const cluster = require('cluster')
const express = require('express')

const workerApp = require('./app')
const logger = require('./utils/logger')
const config = require('./utils/config')

const mainLogger = logger.getLogger('main')
const configLogger = logger.getLogger('config')

const app = express()
const workers = []

if (cluster.isMaster) {
    config.loadConfig().then(() => { }).catch(() => {
        config.saveConfig()
    }).finally(() => {
        configLogger.info('Config loaded')
        mainLogger.info('Starting with spawning workers..')
        for (var i = 0; i < require('os').cpus().length - 1; i++) {
            spawnWorker()
        }
    })
} else {
    workerApp(app)
}

function spawnWorker() {
    const worker = cluster.fork()
    workers.push(worker)

    worker.once('online', () => {
        mainLogger.info('Worker ' + worker.process.pid + ' is ready')
    })
    worker.once('exit', () => {
        mainLogger.info('Worker ' + worker.id + '(PID ' + worker.process.pid + ' died. Starting new worker')
        for (var j = 0; j < workers.length; j++) {
            if (workers[j] === worker) {
                workers.splice(j, 1);
            }
        }
        spawnWorker()
    })
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)

function shutdown() {

    mainLogger.info('OpenEdu shutting down..')
    mainLogger.info('Shutting down Logger..')
    logger.shutdown(() => {
        process.exit(0)
    })
}