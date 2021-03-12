const crypto = require('crypto')

module.exports = {
    sha256: function (data, salt) {
        return crypto.createHmac("sha256", salt).update(data).digest("hex");
    }
}