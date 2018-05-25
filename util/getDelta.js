'use strict';
const request = require('request');

/** Get a specific delta that contains a feature collection
 * @param {object} argv
 * @param {number} id
 */

function getDelta(argv, callback) {
  if (!argv.url) throw new Error('URL is required');
  if (!argv.port) throw new Error('A port is required');
  if (!argv.deltaId) throw new Error('A deltaId is required');

  request({
    url: `http://${argv.url}:${argv.port}/api/delta/${argv.deltaId}`,
    json: true
  }, (err, res) => {
    if (err) {
      console.error('ERROR: Could not retrieve the delta');
      throw err;
    }
    return callback(res);
  });
}

module.exports = getDelta;
