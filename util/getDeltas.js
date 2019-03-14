'use strict';
const request = require('request');

/** Get the list of deltas that contains the history of events: delete, create or modify
according to a limit. Default is 20 and maximun is 100.
 * @param {object} argv
 */

function getDeltas(argv, callback) {
    if (!argv.url) return callback(new Error('URL is required'));
    if (!argv.port) return callback(new Error('A port is required'));

    let urlParameter = '';
    if (argv.offset && argv.limit) urlParameter = `?offset=${argv.offset}&limit=${argv.limit}`;
    else if (argv.offset) urlParameter = `?offset=${argv.offset}`;
    else if (argv.limit) urlParameter = `?limit=${argv.limit}`;

    request({
        url: `http://${argv.url}:${argv.port}/api/deltas${urlParameter}`,
        json: true
    }, (err, deltas) => {
        if (err) {
            console.error('not ok - could not retrieve deltas.');
            return callback(err);
        }
        callback(null, deltas);
    });
}

module.exports = getDeltas;
