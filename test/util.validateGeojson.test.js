'use strict';

const fs = require('fs');
const path = require('path');
const tape = require('tape');
const validateGeojson = require('../util/validateGeojson.js');
const pipeline = require('stream').pipeline;
const split = require('split');

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

/**
tape.only('Assert fails according to schema ', (t) => {
    const pathName = path.resolve(__dirname, '.', './fixtures/invalid-geojson-schema.json');
    const schema = fs.readFileSync(path.resolve(__dirname, '.', './fixtures/schema.json'), 'utf8');
    let message;
    let error;
    let description;
    let linenumber;

    // Validate the corrupted sample data
    const geojsonErrs = validateGeojson(pathName, { schema: JSON.parse(schema) });
    t.ok(geojsonErrs.length > 0, true, 'file is not a valid geoJSON file');

    for (let item in geojsonErrs) {
        message = JSON.parse(geojsonErrs[item]);
        item = parseInt(item);

        switch (item) {
            case 0:
                linenumber = 1;
                error = '[{"message":"should have required property \'source\'"}]';
                description = 'should have required property \'source\'';
                break;
            case 1:
                linenumber = 2;
                error = '[{"message":"should have required property \'street\'"}]';
                description = 'should have required property \'street\'';
                break;
            case 2:
                linenumber = 3;
                error = '[{"message":"should have required property \'number\'"}]';
                description = 'should have required property \'number\'';
                break;
            case 3:
                linenumber = 4;
                error = '[{"message":"should be equal to one of the allowed values"}]';
                description = 'prop1 should be equal to one of the allowed values';
                break;
            case 4:
                linenumber = 5;
                error = '[{"message":"should be string,number"}]';
                description = 'postcode should be string,number';
                break;
            case 5:
                linenumber = 6;
                error = '[{"message":"should be array"}]';
                description = 'street should be array';
                break;
        }

        if (linenumber) {
            t.equals(message.linenumber, linenumber, `the line number is ${linenumber}`);
            t.equals(JSON.stringify(message.error), error, description);
        }
    }
    t.end();
});

*/
