'use strict';

const tape = require('tape');
const validateBbox = require('../util/validateBbox.js');

// From MDN guide to regexp: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


// Invalid bbox input test cases
const invalidBboxes = [
  // Input structure
  {
    bboxInput: '',
    expectedMsg: 'bbox must not be empty, must be minX,minY,maxX,maxY',
    description: 'Empty bbox input'
  },
  {
    bboxInput: {
      'bbox': [-101, 50, -100, 51]
    },
    expectedMsg: 'bbox must be a string in the format minX,minY,maxX,maxY or Array in the format [minX,minY,maxX,maxY]',
    description: 'bbox input of a type other than array or string'
  },
  {
    bboxInput: [-101, 50],
    expectedMsg: 'bbox must have four items in the format minX,minY,maxX,maxY or [minX,minY,maxX,maxY]',
    description: 'bbox input array with fewer than 4 items'
  },
  {
    bboxInput: '-101, 50',
    expectedMsg: 'bbox must have four items in the format minX,minY,maxX,maxY or [minX,minY,maxX,maxY]',
    description: 'bbox input string with fewer than 4 items'
  },
  // minX
  {
    bboxInput: ['test', 1, 2, 3],
    expectedMsg: 'bbox minX value must be a number between -180 and 180',
    description: 'Bbox minX that isnt a number'
  },
  {
    bboxInput: [-190, 50, -100, 51],
    expectedMsg: 'bbox minX value must be a number between -180 and 180',
    description: 'Bbox minX that is less than -180'
  },
  {
    bboxInput: [190, 50, 200, 51],
    expectedMsg: 'bbox minX value must be a number between -180 and 180',
    description: 'Bbox minX that is greater than 180'
  },
  // minY
  {
    bboxInput: [-101, 'test', -100, 51],
    expectedMsg: 'bbox minY value must be a number between -90 and 90',
    description: 'Bbox minY that isnt a number'
  },
  {
    bboxInput: [-101, -91, -100, 51],
    expectedMsg: 'bbox minY value must be a number between -90 and 90',
    description: 'Bbox minY that is less than -90'
  },
  {
    bboxInput: [-101, 91, -100, 51],
    expectedMsg: 'bbox minY value must be a number between -90 and 90',
    description: 'Bbox minY that is greater than 90'
  },
  // maxX
  {
    bboxInput: [-101, 50, 'test', 51],
    expectedMsg: 'bbox maxX value must be a number between -180 and 180',
    description: 'Bbox maxX that isnt a number'
  },
  {
    bboxInput: [-101, 50, -190, 51],
    expectedMsg: 'bbox maxX value must be a number between -180 and 180',
    description: 'Bbox maxX that is less than -180'
  },
  {
    bboxInput: [-101, 50, 190, 51],
    expectedMsg: 'bbox maxX value must be a number between -180 and 180',
    description: 'Bbox maxX that is greater than 180'
  },
  // maxY
  {
    bboxInput: [-101, 50, -100, 'test'],
    expectedMsg: 'bbox maxY value must be a number between -90 and 90',
    description: 'Bbox maxY that isnt a number'
  },
  {
    bboxInput: [-101, 50, -100, -91],
    expectedMsg: 'bbox maxY value must be a number between -90 and 90',
    description: 'Bbox maxY that is less than -90'
  },
  {
    bboxInput: [-101, 50, -100, 91],
    expectedMsg: 'bbox maxY value must be a number between -90 and 90',
    description: 'Bbox maxY that is greater than 90'
  },
  // Relative mins and maxes
  {
    bboxInput: [101, 50, 100, 51],
    expectedMsg: 'bbox minX value cannot be greater than maxX value',
    description: 'Bbox minX that is greater than the maxX'
  },
  {
    bboxInput: [-101, 51, -100, 50],
    expectedMsg: 'bbox minY value cannot be greater than maxY value',
    description: 'Bbox minY that is greater than the maxY'
  }
];

const validBboxes = [
  {
    bboxInput: '-101, 50, -100, 51',
    expected: '-101,50,-100,51',
    description: 'bbox input as a string'
  },
  {
    bboxInput: [-101, 50, -100, 51],
    expected: '-101,50,-100,51',
    description: 'bbox input as an array of numbers'
  },
  {
    bboxInput: ['-101', '50', '-100', '51'],
    expected: '-101,50,-100,51',
    description: 'bbox input as an array of strings'
  }
];

// Assert the errors from invalid bbox inputs
tape('Assert bbox fails', (t) => {

  invalidBboxes.forEach((test) => {
    const expected = new RegExp(escapeRegExp(test.expectedMsg));
    t.throws(() => validateBbox(test.bboxInput), expected, test.description);
  });
  t.end();
});

// Confirm valid bbox inputs
tape('Assert valid bbox inputs', (t) => {

  validBboxes.forEach((test) => {
    t.deepEquals(validateBbox(test.bboxInput), test.expected, test.description);
  });
  t.end();
});

