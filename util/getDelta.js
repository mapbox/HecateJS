'use strict';
const request = require('request');

/** Get a specific delta that contains a feature collection
 * @param {object} argv
 * @param {number} id
 */

function getDelta(argv, callback) {
    if (!argv.url) return callback(new Error('URL is required'));
    if (!argv.port) return callback(new Error('A port is required'));
    if (!argv.deltaId) return callback(new Error('A deltaId is required'));

    request({
        url: `https://${argv.url}:${argv.port}/api/delta/${argv.deltaId}`,
        json: true
    }, (err, res) => {
        if (err) {
            console.error('ERROR: Could not retrieve the delta');
            return callback(err);
        }
        callback(null, res);
    });
}

module.exports = getDelta;
