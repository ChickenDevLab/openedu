const errors = require('../utils/error')
const config = require('../utils/config')
const db = require('../utils/database')

const logger = require('../utils/logger').getLogger('auth')

class RouteRestrictor {
    constructor(allowedTypes = ['student', 'teacher', 'app', 'stuff']) {
        this.allowedTypes = allowedTypes
        this.handle = (req, res, next) => {
            const header = req.headers.authorization
            if (header) {
                const authHeader = header.split(' ')
                if (authHeader.length != 2) {
                    this.handleFail(req, res, 'Invalid auth header')
                } else {
                    if (this.allowedTypes.includes(authHeader[0].toLowerCase())) {
                        switch (authHeader[0].toLowerCase()) {
                            case 'app':
                                if (config.getConfig().security.auth.app_tokens.includes(authHeader[1])) {
                                    req.auth = {
                                        type: 'app'
                                    }
                                    logger.success('App authorizated successfully from ' + req.ip)
                                    next()
                                } else {
                                    this.handleFail(req, res, 'Invalid app token')
                                }

                                break

                            case 'student':
                            case 'teacher':
                            case 'stuff':
                                db.getLoginToken(authHeader[1]).then(data => {
                                    if (data && this.allowedTypes.includes(data.type)) {
                                        req.auth = {
                                            type: 'user'
                                        }
                                        req.user = data
                                        logger.success('User ' + data.name + ' authorizated successfully from ' + req.ip + ' as ' + authHeader[0])
                                        next()
                                    } else {
                                        this.handleFail(req, res, 'Invalid login token')
                                    }
                                })
                                break
                            default:
                                this.handleFail(req, res, 'Unknown error')

                        }
                    } else {
                        this.handleFail(req, res, 'Type ' + authHeader[0] + ' is not allowed')
                    }

                }
            } else {
                this.handleFail(req, res, 'Missing auth header')
            }
        }
    }

    handleFail(req, res, cause) {
        res.status(401).json(errors.unauthorized)
        logger.fail('Auth failed from ' + req.ip + ': ' + cause)
    }
}

module.exports = RouteRestrictor