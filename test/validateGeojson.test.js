'use strict';

// Test lib/validateGeojson.js to confirm that the errors and asserts are the expected ones
const path = require('path');
const tape = require('tape');
const validateGeojson = require('../util/validateGeojson.js');

// Assert the errors in the geojson file
tape('Assert fails', (t) => {
  const pathName = path.resolve(__dirname, '.', './fixtures/invalid-geojson.json');
  let message;
  let error;
  let description;
  let linenumber;

  // Validate the corrupted sample data
  const geojsonErrs = validateGeojson(pathName);
  t.ok(geojsonErrs.length > 0, true, 'file is not a valid geoJSON file');
  for (let item in geojsonErrs) {
    message = JSON.parse(geojsonErrs[item]);
    item = parseInt(item);

    switch (item) {
      case 0:
        linenumber = 1;
        error = '[{"message":"\\"type\\" member required"}]';
        description = 'type member required';
        break;
      case 1:
        linenumber = 2;
        error = '[{"message":"each element in a position must be a number"}]';
        description = 'each element in a position must be a number';
        break;
      case 2:
        linenumber = 3;
        error = '[{"message":"\\"type\\" member required"}]';
        description = 'type member required';
        break;
      case 3:
        linenumber = 4;
        error = '[{"message":"\\"geometry\\" member required"}]';
        description = 'geometry member required';
        break;
      case 4:
        linenumber = 5;
        description = 'coordinates must be other than [0,0]';
        error = '["coordinates must be other than [0,0]"]';
        break;
      case 5:
        linenumber = 6;
        error = '[{"message":"\\"coordinates\\" member required"}]';
        description = 'coordinates member required';
        break;
    }

    if (linenumber) {
      t.equals(message.linenumber, linenumber, `the line number is ${linenumber}`);
      t.equals(JSON.stringify(message.error), error, description);
    }
  }
  t.end();
});

// Confirm that the sample geojson file is a valid geojson file
tape('Assert valid features', (t) => {
  const pathName = path.resolve(__dirname, '.', './fixtures/valid-geojson.json');
  const geojsonErrs = validateGeojson(pathName);
  t.equals(geojsonErrs.length, 0, 'file is a valid geoJSON file');
  t.end();
});
