const redis = require('redis')
const { promisify } = require("util")

const logger = require('./logger').getLogger('database')

let client
let scanAsync

const validUserDataFields = ['name', 'displayName', 'token', 'type']

function _getAllMatchingKeys(match) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
        let cursor = 0
        let keys = []
        try {
            let data = await scanAsync(cursor, 'MATCH', match, 'COUNT', '1000')
            cursor = parseInt(data[0])
            keys = keys.concat(data[1])
        } catch (e) {
            cursor = 0
        }


        while (cursor != 0) {
            try {
                let data = await scanAsync(cursor, 'MATCH', match, 'COUNT', '1000')
                cursor = parseInt(data[0])
                keys = keys.concat(data[1])
            } catch (e) {
                cursor = 0
            }
        }
        resolve(keys)
    })

}

const database = {
    loadDB: async function () {
        client = redis.createClient()
        logger.info('Created redis client in worker ' + process.pid)

        scanAsync = promisify(client.scan).bind(client);
    },

    addLoginToken: function (userdata) {
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
    getLoginToken: function (token) {
        return new Promise((resolve, reject) => {
            client.hgetall('token:' + token, (err, data) => {
                if (err || data == null) {
                    resolve(null)
                } else resolve(data)
            })
        })
    },

    getMeetingIDs: async function () {
        _getAllMatchingKeys('*').then(data => console.log(data))

    }
}
module.exports = database