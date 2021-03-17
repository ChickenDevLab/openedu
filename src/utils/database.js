const redis = require('redis')
const RedisUtilities = require('redis-utilities')

const logger = require('./logger').getLogger('database')
const dispatcher = new (require('cluster-eventdispatcher'))()
const utils = require('../utils')
const hash = require('./hash')
const config = require('./config')

let client

/**
 * @type {RedisUtilities}
 */
let util

const validUserDataFields = ['name', 'displayName', 'token', 'type']
const validMeetingDataFields = ['name', 'realStart', 'start', 'stop']

const database = {
    loadDB: async function () {
        const host = process.env.TYPE === 'DOCKER' ? 'redis' : '127.0.0.1'
        client = redis.createClient({
            host: host
        })
        client.once('error', () => {
            dispatcher.dispatch('redis:error', {
                pid: process.pid
            })
        })
        logger.info('Created redis client in worker ' + process.pid)

        util = new RedisUtilities(client)
    },

    addLoginToken: function (userdata) {
        return new Promise((resolve, reject) => {
            if(!utils.hasAllProperties(userdata, validUserDataFields)){
                reject()
                return
            }
            const key = 'token:' + userdata.token
            client.hgetall(key, async (token) => {
                if (token) {
                    reject()
                } else {
                    await client.hset(key, 'name', userdata.name, 'displayName', userdata.displayName, 'token', userdata.token, 'type', userdata.type)
                    await client.expireat(key, Date.now() + 604800000)
                }
            })

            userdata.expires = Date.now() + 604800000 // eine Woche
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

    getMeetings: function () {
        return new Promise((resolve, reject) => {
            const meetings = []
            util.getAllMatchingKeys('meeting:*', 'hash').then(ids => {
                if(ids.length == 0){
                    resolve([])
                }
                ids.forEach((id, index) => {
                    client.hgetall(id, (err, data) => {
                        if(!(err || data == null)){
                            meetings.push(data)
                            if(index == ids.length -1){
                                resolve(meetings)
                            }
                        } else {
                            resolve([])
                        }
                    })
                })
            })
        })    
    },

    createMeeting: function (meetingData) {
        return new Promise((resolve, reject) => {
            if(!utils.hasAllProperties(validMeetingDataFields)){
                reject()
                return
            }
            const meetingID = hash.sha256(JSON.stringify(meetingData) + process.pid + Date.now(), config.getConfig().security.salt).slice(Math.floor(Math.random() * 70), 6)
        })        
    }
}
module.exports = database