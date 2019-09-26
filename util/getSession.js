'use strict';
const request = require('request');

function getSession(options, callback) {
    if (!options.username) return callback(new Error('username is required'));
    if (!options.password) return callback(new Error('password is required'));
    if (!options.url) return callback(new Error('URL is required'));

    request({
        url: new URL('/api/user/session', options.url),
        json: true,
        auth: { username: options.username, password: options.password }
    }, (err, res) => {
        if (err) {
            console.error(`ERROR: Could not retrieve session of ${options.username}`);
            return callback(err);
        }
        callback(null, res);
    });
}

module.exports = getSession;
