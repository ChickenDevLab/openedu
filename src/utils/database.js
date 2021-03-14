const redis = require('redis')

const logger = require('./logger').getLogger('database')

let client

let users = null
let meetings = null

const validUserDataFields = ['name', 'displayName', 'token', 'type']

const database = {
    loadDB: async function () {
        client = redis.createClient()
        logger.info('Created redis client in worker ' + process.pid)
    },

    addLoginToken: async function (userdata) {
        return new Promise((resolve, reject) => {
            for (k in validUserDataFields) {
                if (userdata[validUserDataFields[k]] == undefined) {
                    reject()
                    return
                }
            }
            const key = 'token:' + userdata.token
            client.hgetall(key, async (token) => {
                if (token) {
                    reject()
                } else {
                    await client.hset(key, 'name', userdata.name, 'displayName', userdata.displayName, 'token', userdata.token, 'type', userdata.type)
                    await client.expireat(key, new Date().getTime() + 604800000)
                }
            })

            userdata.expires = new Date().getTime() + 604800000 // eine Woche
            resolve(userdata)
        })
    },
    getLoginToken: async function (token) {
        return new Promise((resolve, reject) => {
            client.hgetall('token:' + token, (err, data) => {
                if (err || data == null) {
                    resolve(null)
                } else resolve(data)
            })
        })
    }
}
module.exports = database