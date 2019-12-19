'use strict';

const transform = require('parallel-transform');
const geojsonhint = require('@mapbox/geojsonhint').hint;
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
 * @private
 *
 * @param {Object} opts Options object
 * @param {boolean} opts.ignoreRHR=false Ignore Right Hand Rule errors
 * @param {Object} opts.schema JSON Schema to validate properties against
 * @param {boolean} opts.ids If false, disable duplicate ID checking
 *
 * @return {Stream} transform stream to validate GeoJSON
 */
function validateGeojson(opts = {}) {
    // Flag to track the feature line number
    let linenumber = 0;

    let schema = false;

    if (opts.schema) {
        schema = ajv.compile(opts.schema);
    }

    const ids = opts.ids === false ? false : new Set();

    return transform(1, (feat, cb) => {
        if (!feat || !feat.trim()) return cb(null, '');

        linenumber++;
        const errors = validateFeature(feat.toString('utf8'), {
            linenumber: linenumber,
            ignoreRFR: opts.ignoreRHR,
            schema: schema,
            ids: ids
        });

        if (errors.length) {
            errors.map((error) => {
                console.error(error);
            });

            throw new Error('Invalid Feature');
        }

        return cb(null, '');
    });

}

/**
 * Validate a single feature
 *
 * @private
 *
 * @param {Object|string} line Feature to validate
 * @param {Object} options Validation Options
 * @param {boolean} options.ignoreRHR Ignore winding order
 * @param {Function} options.schema AJV Function to validate feature properties against a JSON Schema
 * @param {number} options.linenumber Linenumber to output in error object
 * @param {Set} options.ids Set to keep track of feature id duplicates
 *
 * @returns {Array} Array of errors (empty array if none)
 */
function validateFeature(line, options) {
    if (!options) options = {};
    if (!options.linenumber) options.linenumber = 0;

    // list of errors linked to the file name and line number
    const errors = [];

    let feature;
    if (typeof line === 'object') {
        feature = line;
    } else {
        feature = JSON.parse(line);
    }

    if (options.ids && feature.id && options.ids.has(feature.id)) {
        errors.push({
            message: `Feature ID: ${feature.id} exists more than once`,
            linenumber: options.linenumber
        });
    } else if (options.ids && feature.id) {
        options.ids.add(feature.id);
    }

    if (!feature.action) {
        errors.push({
            message: 'Feature missing action',
            linenumber: options.linenumber
        });
    }

    if (feature.action && !['create', 'modify', 'delete', 'restore'].includes(feature.action)) {
        errors.push({
            message: 'Invalid action',
            linenumber: options.linenumber
        });
    }

    if (!feature.type || feature.type !== 'Feature') {
        errors.push({
            message: 'All GeoJSON must be type: Feature',
            linenumber: options.linenumber
        });
    }

    if (['modify', 'delete', 'restore'].includes(feature.action)) {
        if (!feature.id) {
            errors.push({
                message: `Feature to ${feature.action} must have id`,
                linenumber: options.linenumber
            });
        } else if (!feature.version) {
            errors.push({
                message: `Feature to ${feature.action} must have version`,
                linenumber: options.linenumber
            });
        }
    }

    // Delete features are special in that they have null geometry && properties
    if (feature.action === 'delete') {
        if (feature.properties === undefined) {
            errors.push({
                message: 'Feature to delete should have properties: null',
                linenumber: options.linenumber
            });
        }

        if (feature.geometry === undefined) {
            errors.push({
                message: 'Feature to delete should have geometry: null',
                linenumber: options.linenumber
            });
        }
    // All other features are 100% standard GeoJSON
    } else {
        feature = rewind(feature);

        const geojsonErrs = geojsonhint(feature).filter((err) => {
            if (options.ignoreRHR && err.message === 'Polygons and MultiPolygons should follow the right-hand rule') {
                return false;
            } else {
                return true;
            }
        });

        // Validate that the feature has the required properties by the schema
        if (options.schema) {
            options.schema(feature.properties);
            if (options.schema.errors) {
                options.schema.errors.forEach((e) => {
                    errors.push({
                        message: e.message,
                        linenumber: options.linenumber
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
                linenumber: options.linenumber
            });
        }

        if (geojsonErrs.length) {
            for (const err of geojsonErrs) {
                errors.push({
                    message: err.message,
                    linenumber: options.linenumber
                });
            }
        } else { // if the geojson is invalid, turf will err
            turf.coordEach(feature, (coords) => {
                if (coords[0] < -180 || coords[0] > 180) {
                    errors.push({
                        message: 'longitude must be between -180 and 180',
                        linenumber: options.linenumber
                    });
                }
                if (coords[1] < -90 || coords[1] > 90) {

                    errors.push({
                        message: 'latitude must be between -90 and 90',
                        linenumber: options.linenumber
                    });
                }
                if (coords[0] === 0 && coords[1] === 0) {
                    errors.push({
                        message: 'coordinates must be other than [0,0]',
                        linenumber: options.linenumber
                    });
                }
            });
        }
    }

    return errors;
}

module.exports = validateGeojson;
module.exports.validateFeature = validateFeature;
