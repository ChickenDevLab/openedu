module.exports = {
    missing_fields: JSON.stringify({
        error: true,
        message: 'Missing fields'
    }),
    internal_error: JSON.stringify({
        error: true,
        message: 'Internal Server Error'
    }),
    invalid_credentiels: JSON.stringify({
        error: true,
        message: 'Invalid credentiels'
    }),
    invalid_request: JSON.stringify({
        error: true,
        message: 'Invalid request'
    })    ,
    not_found: JSON.stringify({
        error: true,
        message: 'Not found'
    }),
    unauthorized: JSON.stringify({
        error: true,
        message: 'Unauthorized request'
    })
}