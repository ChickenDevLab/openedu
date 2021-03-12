const log4js = require('log4js')

log4js.configure({
    levels: {
        http: {
            value: 3,
            colour: 'cyan'
        }
    },
    appenders: {
        file: {
            type: 'dateFile',
            pattern: '-yyyy-MM-dd',
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
            level: 'debug'
        },
        main: {
            appenders: ['file', 'console'],
            level: 'debug'
        },
        database: {
            appenders: ['file', 'console'],
            level: 'debug'
        },
        config: {
            appenders: ['file', 'console'],
            level: 'debug'
        },
        login: {
            appenders: ['file', 'console'],
            level: 'http'
        }
    }
})

module.exports = log4js
