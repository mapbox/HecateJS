'use strict';
const request = require('request');

function getSession(options, callback) {
    if (!options.username) return callback(new Error('username is required'));
    if (!options.password) return callback(new Error('password is required'));
    if (!options.url) return callback(new Error('URL is required'));
    if (!options.port) return callback(new Error('port is required'));

    request({
        url: `http://${options.username}:${options.password}@${options.url}:${options.port}/api/user/session`,
        json: true
    }, (err, res) => {
        if (err) {
            console.error(`ERROR: Could not retrieve session of ${options.username}`);
            return callback(err);
        }
        callback(null, res);
    });
}

module.exports = getSession;
