const loki = require('lokijs')
const cron = require('node-cron')

const logger = require('./logger').getLogger('database')

let db

let users = null
let meetings = null

const validUserDataFields = ['name', 'displayName', 'token', 'type']

const afterLoad = function () {
    users = db.getCollection('users')
    if (users == null) {
        logger.info('User collection does not exsits; creating new..')
        users = db.addCollection('users', {
            unique: ['token']
        })
    }
    meetings = db.getCollection('meetings')
    if (meetings == null) {
        logger.info('Meeting collection does not exsits; creating new..')
        meetings = db.addCollection('meetings')
    }
    database.clearExpiredTokens()
    logger.info('Initialize Token Cleaner')

    cron.schedule('*/15 * * * *', () => {
        database.clearExpiredTokens()
    })

    logger.info('Database loaded')
}

const database = {
    loadDB: function () {
        db = new loki('main.db', {
            autoload: true,
            autosave: true,
            autosaveInterval: 5000,
            autoloadCallback: afterLoad
        })
    },
    saveDB: function () {
        return new Promise(resolve => {
            logger.info('Databases saved')
            db.saveDatabase(resolve)
        })
    },
    clearExpiredTokens: function () {
        const cnt = users.find({
            expires: {
                $lt: new Date().getTime()
            }
        }).length

        users.removeWhere({
            expires: {
                $lt: new Date().getTime()
            }
        })
        logger.info('Removed ' + cnt + ' expired login tokens')
    },
    addLoginToken: async function (userdata) {
        return new Promise((resolve, reject) => {
            for (key in validUserDataFields) {
                if (userdata[validUserDataFields[key]] == undefined) {
                    reject()
                    return
                }
            }
            if (users.by('token', userdata.token)) {
                reject()
                return
            }

            userdata.expires = new Date().getTime() + 604800000 // eine Woche
            users.insert(userdata)
            delete userdata['meta']
            delete userdata['$loki']
            resolve(userdata)
        })
    }
}
module.exports = database