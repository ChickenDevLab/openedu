const errors = require('../utils/error')

module.exports = {
    meetingsList: (req, res) => {
        res.json({
            type: req.auth.type,
            user: req.user
        })
    }
}