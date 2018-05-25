'use strict';

const geojsonhint = require('@mapbox/geojsonhint').hint;
const readLineSync = require('n-readlines');
const path = require('path');
const turf = require('@turf/turf');

function validateGeojson(filepath) {
  // Read each feature
  const rl = new readLineSync(filepath);
  // Get the file name
  const filename = path.basename(filepath);
  // Flag to track the feature line number
  let linenumber = 0;
  // list of errors linked to the file name and line number
  const corruptedfeatures = [];

  let line = true;
  while (line) {
    line = rl.next();
    if (!line) break;
    validateFeature(line.toString('utf8'));
  }
  // Validate each feature
  function validateFeature(line) {
    const feature = JSON.parse(line);
    linenumber++;
    let errors = [];

    const geojsonErrs = geojsonhint(feature);
    if (geojsonErrs.length) {
      errors = errors.concat(geojsonErrs);
    } else { // if the geojson is invalid, turf will err
      turf.coordEach(feature, (coords) => {
        if (coords[0] < -180 || coords[0] > 180) {
          errors.push('longitude must be between -180 and 180');
        }
        if (coords[1] < -90 || coords[1] > 90) {
          errors.push('latitude must be between -90 and 90');
        }
        if (coords[0] === 0 && coords[1] === 0) {
          errors.push('coordinates must be other than [0,0]');
        }
      });
    }
    if (errors.length) {
      corruptedfeatures.push(JSON.stringify({ 'linenumber': linenumber, 'error': errors, 'filename': filename }));
    }
  }
  return corruptedfeatures;
}

module.exports = validateGeojson;
