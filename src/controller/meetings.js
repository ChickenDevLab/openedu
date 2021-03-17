const errors = require('../utils/error')
const db = require('../utils/database')

const logger = require('../utils/logger').getLogger('meetings')

function parseAndValidateDates(day, start, stop){
    return new Promise((resolve, reject) => {
        const parts = day.split('.')
        if(parts.length == 3) {
            try{
                const startD = new Date(parts[2], parts[1] -1, parts[0])
                const stopD = new Date(parts[2], parts[1] -1, parts[0])

                const startP = start.split(':')
                const stopP = stop.split(':')

                startD.setHours(parseInt(startP[0]), parseInt(startP[1], 0))
                stopD.setHours(parseInt(stopP[0]), parseInt(stopP[1], 0))
                resolve({
                    start: startD,
                    stop: stopD
                })
            } catch (e) {
                reject()
            }
        } else {
            reject()
        }
    })    
}

module.exports = {
    meetingsList: (req, res) => {
        db.getMeetings().then(meetings => {
            res.status(200).json(meetings)
        })        
    },
    createMeeting: (req, res) => {
        const content = req.body
        if(content.date && content.start && content.stop && content.title){
            parseAndValidateDates(content.date, content.start, content.stop).then(dates => {
                db.createMeeting({
                    name: content.title,
                    realStart: dates.start.getTime() - 1000 * 60 * 15,
                    start: dates.start.getTime(),
                    stop: dates.stop.getTime()
                }).then(meeting => {
                    res.status(200).send(meeting.id)
                    logger.http('Meeting ' + meeting.id + ' was created.')
                }, () => {
                    res.status(400).send(errors.internal_error)
                })
            }, () => {
                res.status(400).send(errors.invalid_request)
            })
        } else {
            res.status(400).send(errors.missing_fields)
        }
    }
}