const loginLogger = require('../utils/logger').getLogger('login')
const error = require('../utils/error')
const config = require('../utils/config')
const hash = require('../utils/hash')
const db = require('../utils/database')

const fetch = require('node-fetch')
const { JSDOM } = require('jsdom')
const FormData = require('form-data')
const cron = require('node-cron')

const dispatcher = new (require('cluster-eventdispatcher'))()

let internalCounter = 0

function loginToLernsax(name, password) {
    return new Promise((resolve, reject) => {
        const form = new FormData()
        form.append('login_login', name)
        form.append('login_password', password)
        fetch('https://www.lernsax.de/wws/100001.php', {
            method: 'post',
            body: form
        }).then(resp => resp.text()).then(t => {
            let uName
            let displayName
            const dom = new JSDOM(t).window.document
            uName = dom.getElementsByTagName('body')[0].getAttribute('data-login')
            if (!uName) {
                reject(name)
            } else {
                displayName = dom.getElementsByClassName('top_user_name')[0].innerHTML
                resolve({
                    userName: uName,
                    displayName: displayName
                })
            }
        }).catch(() => {
            reject(name)
        })
    })
}

function validateTeacherID(id) {
    return new Promise((resolve, reject) => {
        fetch('https://planungstool-fsg.de/klassen_id.php?lehrer_id=' + id).then(resp => resp.text()).then(t => {
            const dom = new JSDOM(t).window.document
            resolve(dom.getElementById('nomatch') == null)
        }).catch(() => {
            resolve(false)
        })
    })
}

const controller = {
    student: async (req, res) => {
        internalCounter++
        if (!req.body['name'] || !req.body['password']) {
            res.status(400).send(error.missing_fields)
        } else {

            loginToLernsax(req.body['name'], req.body['password']).then((data) => {
                loginLogger.http('Student logged in from ' + req.ip + ' as ' + data.userName)
                const token = hash.sha256(internalCounter + data.userName + Date.now(), config.getConfig().security.salt)
                const userdata = {
                    name: data.userName,
                    token: token,
                    displayName: data.displayName,
                    type: 'student'
                }
                db.addLoginToken(userdata).then((ret) => {
                    res.json(ret)
                }, () => {
                    res.status(500).send(error.internal_error)
                })
            }, (name) => {
                res.status(401).send(error.invalid_credentiels)
                loginLogger.http('Student login as ' + name + ' from ' + req.ip + ' failed: invalid credentiels')
            })

        }

    },
    teacher: async (req, res) => {
        internalCounter++
        if (!req.body['name'] || !req.body['password'] || !req.body['teacherID']) {
            res.status(400).send(error.missing_fields)
        } else {
            validateTeacherID(req.body['teacherID']).then(isValid => {
                if (isValid) {
                    loginToLernsax(req.body['name'], req.body['password']).then((data) => {
                        loginLogger.http('Teacher logged in from ' + req.ip + ' as ' + data.userName)
                        const token = hash.sha256(internalCounter + data.userName + Date.now() + process.pid, config.getConfig().security.salt)
                        const userdata = {
                            name: data.userName,
                            token: token,
                            displayName: data.displayName,
                            type: 'teacher'
                        }
                        db.addLoginToken(userdata).then((ret) => {
                            res.json(ret)
                        }, () => {
                            res.status(500).send(error.internal_error)
                        })
                    }, (name) => {
                        res.status(401).send(error.invalid_credentiels)
                        loginLogger.http('Teacher login as ' + name + ' from ' + req.ip + ' failed: invalid credentiels')
                    })
                } else {
                    res.status(401).send(error.invalid_credentiels)
                    loginLogger.http('Teacher login as ' + req.body['username'] + ' from ' + req.ip + ' failed: invalid credentiels')
                }
            }).catch(() => {
                res.status(401).send(error.invalid_credentiels)
                loginLogger.http('Teacher login as ' + req.body['username'] + ' from ' + req.ip + ' failed: invalid credentiels')
            })
        }
    },
    token: async (req, res) => {
        if(!req.params.token){
            res.status(400).send(error.invalid_request)
        } else {
            db.getLoginToken(req.params.token).then(data => {
                res.status(data ? 200: 400).send(data ? data : error.not_found)
                loginLogger.http(data ? ('Token information for ' + data.name + ' was retrieved from ' + req.ip) : (req.ip + ' tried to fetch information about invalid token.'))
            })
        }
    }
}

dispatcher.on('scheduler', (data) => {
    if(data === '1h'){
        internalCounter = 0
    }
})

module.exports = controller