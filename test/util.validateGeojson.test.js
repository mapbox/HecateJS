'use strict';

const fs = require('fs');
const Ajv = require('ajv');
const path = require('path');
const tape = require('tape');
const validateGeojson = require('../util/validateGeojson.js');
const pipeline = require('stream').pipeline;
const split = require('split');

const ajv = new Ajv({
        schemaId: 'auto'
});

ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'));

// Assert the errors in the geojson file
tape('Assert fails', (t) => {
    // Validate the corrupted sample data
    t.deepEquals(validateGeojson.validateFeature({
        'properties': {
            'number':0,
            'street':[{ 'display':'\\N','priority':0 }]
        },
        'geometry':{
            'type':'Point',
            'coordinates': [23.6,23.5]
        }
    }), [{
        message: '"type" member required',
        linenumber: 0
    }]);

    t.deepEquals(validateGeojson.validateFeature({
        type: 'Feature',
        'properties': {
            'number':0,
            'street':[{ 'display':'\\N','priority':0 }]
        },
        'geometry':{
            'type':'Point',
            'coordinates': [null,23.5]
        }
    }), [{
        message: 'each element in a position must be a number',
        linenumber: 0
    }]);

    t.deepEquals(validateGeojson.validateFeature({
        type: 'Feature',
        'properties': {
            'number':0,
            'street':[{ 'display':'\\N','priority':0 }]
        },
        'geometry':{
            'coordinates': [null,23.5]
        }
    }), [{
        message: '"type" member required',
        linenumber: 0
    }]);

    t.deepEquals(validateGeojson.validateFeature({
        type: 'Feature',
        'properties': {
            'number':0,
            'street':[{ 'display':'\\N','priority':0 }]
        }
    }), [{
        message: 'Null or Invalid Geometry',
        linenumber: 0
    },{
        message: '"geometry" member required',
        linenumber: 0
    }]);

    t.deepEquals(validateGeojson.validateFeature({
        type: 'Feature',
        'properties': {
            'number':0,
            'street':[{ 'display':'\\N','priority':0 }]
        },
        geometry: {
            type: 'Point',
            coordinates: [0,0]
        }
    }), [{
        message: 'coordinates must be other than [0,0]',
        linenumber: 0
    }]);

    t.deepEquals(validateGeojson.validateFeature({
        type: 'Feature',
        'properties': {
            'number':0,
            'street':[{ 'display':'\\N','priority':0 }]
        },
        geometry: {
            type: 'Point'
        }
    }), [{
        message: 'Null or Invalid Geometry',
        linenumber: 0
    },{
        message: '"coordinates" member required',
        linenumber: 0
    }]);

    t.end();
});

// Confirm that the sample geojson file is a valid geojson file
tape('Assert valid features', (t) => {
    pipeline(
        fs.createReadStream(path.resolve(__dirname, '.', './fixtures/valid-geojson.json')),
        split(),
        validateGeojson(),
        (err) => {
            t.error(err);
            t.end();
        }
    );
});

tape('Assert fails according to schema ', (t) => {
    const schemaJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '.', './fixtures/schema.json'), 'utf8'));

    const schema = ajv.compile(schemaJson);

    t.deepEquals(validateGeojson.validateFeature({
        'properties': {
            'number':0,
            'street':[{ 'display':'\\N','priority':0 }]
        },
        'geometry':{
            'type':'Point',
            'coordinates': [23.6,23.5]
        }
    }, {
        schema: schema
    }), [{
        message: 'should have required property \'source\'',
        linenumber: 0
    },{
        message: '"type" member required',
        linenumber: 0
    }]);

    t.end();
});
