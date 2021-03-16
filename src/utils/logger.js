const log4js = require('log4js')

log4js.configure({
    levels: {
        http: {
            value: 14000,
            colour: 'cyan'
        },
        fail: {
            value: 15000,
            colour: 'red'
        },
        success: {
            value: 15000,
            colour: 'green'
        },
        info: {
            value: 20000,
            colour: 'grey'
        }
    },
    appenders: {
        file: {
            type: 'dateFile',
            pattern: 'yyyy-MM-dd',
            keepFileExt: true,
            filename: 'logs/log.log'
        },
        console: {
            type: 'console',
        }
    },
    categories: {
        default: {
            appenders: ['file', 'console'],
            level: 'http'
        },
        main: {
            appenders: ['file', 'console'],
            level: 'http'
        },
        database: {
            appenders: ['file', 'console'],
            level: 'http'
        },
        config: {
            appenders: ['file', 'console'],
            level: 'http'
        },
        login: {
            appenders: ['file', 'console'],
            level: 'http'
        },
        gateway: {
            appenders: ['file', 'console'],
            level: 'http'
        },
        auth: {
            appenders: ['file', 'console'],
            level: 'http'
        }
    }
})

module.exports = log4js
