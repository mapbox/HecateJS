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
        message: 'Feature missing action',
        linenumber: 0
    },{
        message: 'All GeoJSON must be type: Feature',
        linenumber: 0
    },{
        message: '"type" member required',
        linenumber: 0
    }]);

    t.deepEquals(validateGeojson.validateFeature({
        type: 'Feature',
        action: 'create',
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
        action: 'create',
        properties: {
            number: 0,
            street: [{ 'display':'\\N','priority':0 }]
        },
        geometry:{
            coordinates: [null,23.5]
        }
    }), [{
        message: '"type" member required',
        linenumber: 0
    }]);

    t.deepEquals(validateGeojson.validateFeature({
        type: 'Feature',
        action: 'create',
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
        action: 'create',
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
        action: 'delete',
        'properties': {
            'number':0,
            'street': [{ 'display':'\\N','priority':0 }]
        },
        geometry: {
            type: 'Point',
            coordinates: [0,0]
        }
    }), [{
        message: 'Feature to delete must have id',
        linenumber: 0
    }]);

    t.deepEquals(validateGeojson.validateFeature({
        id: 1,
        type: 'Feature',
        action: 'delete',
    }), [{
        message: 'Feature to delete must have version',
        linenumber: 0
    },{
        message: 'Feature to delete should have properties: null',
        linenumber: 0
    },{
        message: 'Feature to delete should have geometry: null',
        linenumber: 0
    }]);

    t.deepEquals(validateGeojson.validateFeature({
        type: 'Feature',
        action: 'modify',
        'properties': {
            'number':0,
            'street': [{ 'display':'\\N','priority':0 }]
        },
        geometry: {
            type: 'Point',
            coordinates: [1,1]
        }
    }), [{
        message: 'Feature to modify must have id',
        linenumber: 0
    }]);

    t.deepEquals(validateGeojson.validateFeature({
        type: 'Feature',
        action: 'create',
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
        action: 'create',
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
        message: 'All GeoJSON must be type: Feature',
        linenumber: 0
    },{
        message: 'should have required property \'source\'',
        linenumber: 0
    },{
        message: '"type" member required',
        linenumber: 0
    }]);

    t.end();
});

tape('Duplicate ID Checks', (t) => {
    const ids = new Set();

    t.deepEquals(validateGeojson.validateFeature({
        id: 1,
        type: 'Feature',
        action: 'modify',
        version: 2,
        properties: {
            number: 0,
            street: [{ 'display':'\\N','priority':0 }]
        },
        geometry: {
            type: 'Point',
            coordinates: [23.6,23.5]
        }
    }, {
        ids: ids
    }), []);

    t.deepEquals(validateGeojson.validateFeature({
        id: 1,
        type: 'Feature',
        action: 'modify',
        version: 2,
        properties: {
            number: 0,
            street: [{ 'display':'\\N','priority':0 }]
        },
        geometry: {
            type: 'Point',
            coordinates: [23.6,23.5]
        }
    }, {
        ids: ids
    }), [{
        message: 'Feature ID: 1 exists more than once',
        linenumber: 0
    }]);

    t.end();
});
