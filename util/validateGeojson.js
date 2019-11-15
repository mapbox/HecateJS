'use strict';

const transform = require('parallel-transform');
const geojsonhint = require('@mapbox/geojsonhint').hint;
const readLineSync = require('n-readlines');
const path = require('path');
const turf = require('@turf/turf');
const rewind = require('geojson-rewind');
const Ajv = require('ajv');

const ajv = new Ajv({
    schemaId: 'auto'
});

ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));


// list of errors linked to the file name and line number
const corruptedfeatures = [];

/**
 * Ensure geometries are valid before import
 *
 * @param {String} filepath File to validate against
 * @param {Object} opts
 * @param {boolean} opts.ignoreRHR=false Ignore Right Hand Rule errors
 */
function validateGeojson(filepath, opts = {}) {
    // Flag to track the feature line number
    let linenumber = 0;

    let validate = false;

    if (opts.schema) {
        validate = ajv.compile(opts.schema);
    }

    return transform(1, (feat, cb) => {
        if (!feat || !feat.trim()) return;

        validateFeature(feat.toString('utf8'));

        if (corruptedfeatures.length) {
            corruptedfeatures((feat) => {
                console.error(feat);
            });
            throw new Error('Invalid Features');
        };

        return cb();
    });

    // Validate each feature
    function validateFeature(line) {
        const feature = rewind(JSON.parse(line));
        linenumber++;
        let errors = [];

        const geojsonErrs = geojsonhint(feature).filter((err) => {
            if (opts.ignoreRHR && err.message === 'Polygons and MultiPolygons should follow the right-hand rule') {
                return false;
            } else {
                return true;
            }
        });

        // Validate that the feature has the required properties by the schema
        if (validate) {
            const schemaErrors = validate(feature.properties);
            if (schemaErrors) {
                schemaErrors.forEach((e) => {
                    errors.push({
                        message: e.message
                    });
                });
            }
        }

        if (
            !feature.geometry
            || !feature.geometry.coordinates
            || !feature.geometry.coordinates.length
        ) {
            errors.push({
                'message': 'Null or Invalid Geometry'
            });
        }

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
            corruptedfeatures.push(JSON.stringify({
                'linenumber': linenumber,
                'error': errors,
                'filename': filename
            }));
        }
    }
}

module.exports = validateGeojson;
