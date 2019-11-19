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


/**
 * Ensure geometries are valid before import
 *
 * @param {Object} opts Options object
 * @param {boolean} opts.ignoreRHR=false Ignore Right Hand Rule errors
 * @param {Object} opts.schema JSON Schema to validate properties against
 */
function validateGeojson(opts = {}) {
    // Flag to track the feature line number
    let linenumber = 0;

    let validateSchema = false;

    if (opts.schema) {
        validateSchema = ajv.compile(opts.schema);
    }

    // list of errors linked to the file name and line number
    const errors = [];

    return transform(1, (feat, cb) => {
        if (!feat || !feat.trim()) return cb(null, '');

        validateFeature(feat.toString('utf8'));

        if (errors.length) {
            errors.map((error) => {
                console.error(error);
            });
            throw new Error('Invalid Feature');
        };

        return cb(null, '');
    });

    // Validate each feature
    function validateFeature(line) {
        const feature = rewind(JSON.parse(line));
        linenumber++;

        const geojsonErrs = geojsonhint(feature).filter((err) => {
            if (opts.ignoreRHR && err.message === 'Polygons and MultiPolygons should follow the right-hand rule') {
                return false;
            } else {
                return true;
            }
        });

        // Validate that the feature has the required properties by the schema
        if (validateSchema) {
            validateSchema(feature.properties);
            if (validateSchema.errors) {
                validateSchema.errors.forEach((e) => {
                    errors.push({
                        message: e.message,
                        linenumber: linenumber
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
                'message': 'Null or Invalid Geometry',
                linenumber: linenumber
            });
        }

        if (geojsonErrs.length) {
            for (const err of geojsonErrs) {
                errors.push({
                    message: err.message,
                    linenumber: linenumber
                });
            }
        } else { // if the geojson is invalid, turf will err
            turf.coordEach(feature, (coords) => {
                if (coords[0] < -180 || coords[0] > 180) {
                    errors.push({
                        message: 'longitude must be between -180 and 180',
                        linenumber: linenumber
                    });
                }
                if (coords[1] < -90 || coords[1] > 90) {

                    errors.push({
                        message: 'latitude must be between -90 and 90',
                        linenumber: linenumber
                    });
                }
                if (coords[0] === 0 && coords[1] === 0) {
                    errors.push({
                        message: 'coordinates must be other than [0,0]',
                        linenumber: linenumber
                    });
                }
            });
        }
    }
}

module.exports = validateGeojson;
