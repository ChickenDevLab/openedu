const fs = require('fs')

const standartConfig = {
    openvidu_url: 'https://localhost:4443',
    openvidu_secret: 'MY_SECRET',
    port: 80,
    security: {
        salt: 'standart salt',
        auth: {
            app_tokens: [
                'test-Token'
            ]
        }
    }
}

let config

module.exports.getConfig = function () {
    return config;
}

module.exports.saveConfig = function () {
    return new Promise((resolve, reject) => {
        fs.writeFile('config.json', JSON.stringify(config, null, 3), err => {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}

module.exports.loadConfig = function () {
    return new Promise((resolve, reject) => {
        fs.readFile('config.json', 'utf8', (err, data) => {
            if (err) {
                config = standartConfig
                reject(err)
            } else {
                try {
                    const unsecureConfig = JSON.parse(data)
                    for (var key in standartConfig) {
                        if (!unsecureConfig[key]) {
                            unsecureConfig[key] = standartConfig[key]
                        }
                    }
                    config = unsecureConfig
                    if (unsecureConfig !== JSON.parse(data)) {
                        reject()
                    } else {
                        resolve()
                    }
                } catch (e) {
                    config = standartConfig
                    reject()
                }
            }
        })
    })
}