'use strict';
const request = require('request');

/** Get history of a specific feature
 * @param {object} argv
 * @param {number} featureId
 */

function getFeatureHistory(argv, featureId, callback) {
    if (!featureId) return callback(new Error('A feature ID is required'));

    request({
        url: `http://${argv.url}:${argv.port}/api/data/feature/${featureId}/history`,
        json: true
    }, (err, res) => {
        if (err) {
            console.error('ERROR: Could not retrieve the feature history list');
            return callback(err);
        }
        callback(null, res);
    });
}

module.exports = getFeatureHistory;
